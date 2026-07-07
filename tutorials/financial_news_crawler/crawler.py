#!/usr/bin/env python3
"""
Financial News Crawler – 递归式AI金融新闻爬虫

用法：
    python crawler.py https://finance.eastmoney.com
    python crawler.py https://finance.eastmoney.com --max-depth 2 --max-links 5
    python crawler.py https://finance.yahoo.com --model qwen2.5:7b --output report.json

环境变量（.env）：
    WATERCRAWL_API_KEY      必填
    WATERCRAWL_BASE_URL     默认 http://10.60.151.130:8080
    OLLAMA_BASE_URL         默认 http://localhost:11434
"""
import argparse
import json
import logging
import os
import sys
import time
import traceback
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
LOGGER = logging.getLogger(__name__)


# ═══════════════════════════ 客户端封装 ═══════════════════════════

class WaterCrawlClient:
    """封装自建 WaterCrawl API 的爬取操作。"""

    def __init__(self, api_key: str, base_url: str = "http://10.60.151.130:7208"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {api_key}"})

    def scrape_url(self, url: str) -> Optional[Dict]:
        """爬取单个URL，返回 markdown/links/title。"""
        payload = {
            "url": url,
            "crawl_type": "single",
            "page_options": {
                "only_main_content": True,
                "include_html": False,
                "include_links": True,
                "wait_time": 0,
            },
        }
        try:
            resp = self.session.post(
                f"{self.base_url}/api/v1/core/crawl-requests/",
                json=payload,
                timeout=30,
            )
            resp.raise_for_status()
            req_id = resp.json().get("uuid")
            return self._poll_result(req_id) if req_id else None
        except requests.RequestException as e:
            LOGGER.warning("WaterCrawl 请求失败 %s: %s", url, e)
            return None

    def _poll_result(self, req_id: str, timeout: int = 120) -> Optional[Dict]:
        """轮询爬取结果直到完成或超时。"""
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                resp = self.session.get(
                    f"{self.base_url}/api/v1/core/crawl-requests/{req_id}/",
                    timeout=10,
                )
                resp.raise_for_status()
                status = resp.json().get("status")

                if status == "finished":
                    r = self.session.get(
                        f"{self.base_url}/api/v1/core/crawl-requests/{req_id}/results/",
                        timeout=10,
                    )
                    r.raise_for_status()
                    results = r.json()
                    if isinstance(results, list) and results:
                        return results[0]
                    return {"markdown": "", "links": [], "title": ""}

                if status in ("failed", "canceled"):
                    LOGGER.warning("爬取 %s 状态: %s", req_id, status)
                    return None
            except requests.RequestException:
                pass
            time.sleep(2)
        LOGGER.warning("爬取 %s 超时", req_id)
        return None


class OllamaClient:
    """封装本地 Ollama API。"""

    def __init__(self, model: str = "qwen2.5:7b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url.rstrip("/")

    def ask(self, prompt: str, system: Optional[str] = None, temperature: float = 0.1) -> str:
        """调用本地模型，返回文本回复。"""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        try:
            resp = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature},
                },
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"].strip()
        except Exception as e:
            LOGGER.error("Ollama 请求失败: %s", e)
            return ""


# ═══════════════════════════ Prompt 模板 ═══════════════════════════

SYSTEM_PROMPT = """你是一名金融新闻分析助手。你的任务：
1. 从文章中提取关键金融信息（市场动态、公司新闻、经济指标等）
2. 筛选出值得继续追踪的相关链接
3. 判断内容是否属于金融新闻范畴"""

ANALYSIS_PROMPT = """分析以下金融新闻文章，返回 JSON。

URL: {url}
标题: {title}

内容：
{content}

请返回以下 JSON 格式（不要带 markdown 代码块标记）：
{{
  "summary": "2-3句话的金融信息摘要",
  "key_points": ["要点1", "要点2"],
  "relevant_links": [
    {{"url": "完整绝对URL", "reason": "为什么这个链接值得跟进"}}
  ],
  "is_financial": true 或 false
}}

规则：
- 只提取金融/经济/投资相关的链接
- 链接必须是绝对 URL（如果是相对路径，请用 {base_url} 补全）
- 非金融内容设为 false
- 最多选 5 个最相关的链接"""

REPORT_PROMPT = """你是一名金融分析师。请根据以下爬取到的文章，生成一份金融新闻综合报告。

已分析的文章：
{articles}

请输出一份结构清晰的 Markdown 报告，包含：
1. 市场概览 —— 重要市场动向
2. 公司要闻 —— 重要公司动态
3. 经济指标 —— 相关经济数据
4. 行业观察 —— 值得关注的行业趋势
5. 投资要点 —— 关键信息总结"""


# ═══════════════════════════ 核心逻辑 ═══════════════════════════

@dataclass
class Article:
    """单篇文章的解析结果。"""
    url: str
    title: str
    summary: str
    key_points: List[str]
    raw_content_snippet: str
    depth: int


@dataclass
class NewsCrawler:
    """递归式金融新闻爬虫。"""
    wc: WaterCrawlClient
    llm: OllamaClient
    max_depth: int = 2
    max_links: int = 5
    max_total: int = 30
    same_domain: bool = True

    _visited: Set[str] = field(default_factory=set)
    _articles: List[Article] = field(default_factory=list)
    _queue: deque = field(default_factory=deque)

    def run(self, seed_url: str) -> Dict[str, Any]:
        """启动爬取。"""
        domain = urlparse(seed_url).netloc
        LOGGER.info("=" * 60)
        LOGGER.info("金融新闻爬虫启动")
        LOGGER.info("入口URL: %s", seed_url)
        LOGGER.info("最大深度: %d | 每页链接: %d | 总上限: %d", self.max_depth, self.max_links, self.max_total)
        LOGGER.info("本地模型: %s", self.llm.model)
        LOGGER.info("=" * 60)

        self._queue.append((seed_url, 0))
        self._visited.add(seed_url)

        while self._queue and len(self._articles) < self.max_total:
            url, depth = self._queue.popleft()
            if depth > self.max_depth:
                continue

            LOGGER.info("[深度 %d] 处理: %s", depth, url)
            article = self._process(url, depth, domain)
            if article:
                self._articles.append(article)

        return self._final_report()

    def _process(self, url: str, depth: int, domain: str) -> Optional[Article]:
        """爬取一个URL并用LLM分析。"""
        result = self.wc.scrape_url(url)
        if not result:
            LOGGER.warning("  ✗ 爬取失败")
            return None

        # 提取内容
        markdown = (result.get("markdown") or
                    result.get("result", {}).get("markdown") or "")
        title = (result.get("title") or
                 result.get("result", {}).get("metadata", {}).get("title") or "")
        links = (result.get("links") or
                 result.get("result", {}).get("links") or [])

        if len(markdown.strip()) < 50:
            LOGGER.warning("  ✗ 内容过短")
            return None

        LOGGER.info("  内容: %d字符 | 链接: %d个", len(markdown), len(links))

        # 调用 Qwen 分析
        base = url[: url.rfind("/") + 1] if "/" in url else url
        resp = self.llm.ask(
            ANALYSIS_PROMPT.format(
                url=url, title=title, content=markdown[:6000], base_url=base
            ),
            system=SYSTEM_PROMPT,
        )
        if not resp:
            return None

        analysis = self._parse_json(resp)
        if not analysis.get("is_financial", True):
            LOGGER.info("  - 非金融内容，跳过链接")
            return Article(url, title, analysis.get("summary", ""),
                           analysis.get("key_points", []), markdown[:300], depth)

        LOGGER.info("  ✓ 金融内容，筛选链接中...")
        for link in analysis.get("relevant_links", [])[: self.max_links]:
            link_url = link.get("url", "")
            if not link_url or link_url in self._visited:
                continue
            if self.same_domain and urlparse(link_url).netloc != domain:
                continue
            self._visited.add(link_url)
            self._queue.append((link_url, depth + 1))

        LOGGER.info("  → 加入 %d 个链接待爬", min(len(analysis.get("relevant_links", [])), self.max_links))
        return Article(url, title, analysis.get("summary", ""),
                       analysis.get("key_points", []), markdown[:300], depth)

    @staticmethod
    def _parse_json(text: str) -> Dict[str, Any]:
        """从 LLM 回复中提取 JSON。"""
        try:
            if "```" in text:
                for part in text.split("```"):
                    p = part.strip()
                    if p.startswith("json"):
                        p = p[4:].strip()
                    if p.startswith("{"):
                        text = p
                        break
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            return {"summary": text[:200], "key_points": [], "relevant_links": [],
                    "is_financial": True}

    def _final_report(self) -> Dict[str, Any]:
        """生成最终报告。"""
        if not self._articles:
            return {"summary": "未找到金融文章", "articles": [], "full_report": ""}

        articles_text = "\n\n".join(
            f"【文章{i}】\nURL: {a.url}\n标题: {a.title}\n摘要: {a.summary}\n要点: {', '.join(a.key_points)}"
            for i, a in enumerate(self._articles, 1)
        )
        report = self.llm.ask(REPORT_PROMPT.format(articles=articles_text))

        return {
            "full_report": report,
            "articles": [
                {"url": a.url, "title": a.title, "summary": a.summary,
                 "key_points": a.key_points, "depth": a.depth}
                for a in self._articles
            ],
            "total_articles": len(self._articles),
        }


# ═══════════════════════════ 命令行入口 ═══════════════════════════

def main():
    parser = argparse.ArgumentParser(description="金融新闻爬虫 —— 递归式AI金融新闻采集")
    parser.add_argument("url", help="入口URL（如新闻首页）")
    parser.add_argument("--max-depth", type=int, default=2, help="递归深度（默认 2）")
    parser.add_argument("--max-links", type=int, default=5, help="每页最多跟进链接数（默认 5）")
    parser.add_argument("--max-total", type=int, default=30, help="总文章数上限（默认 30）")
    parser.add_argument("--model", default="qwen2.5:7b", help="Ollama 模型名")
    parser.add_argument("--ollama-url", help="Ollama 地址（默认从 .env 读取）")
    parser.add_argument("--no-domain-limit", action="store_true", help="允许跨域名跟进")
    parser.add_argument("--output", help="输出 JSON 文件路径")
    parser.add_argument("-v", "--verbose", action="store_true", help="调试日志")
    args = parser.parse_args()

    if args.verbose:
        LOGGER.setLevel(logging.DEBUG)

    load_dotenv()

    api_key = os.getenv("WATERCRAWL_API_KEY")
    if not api_key:
        LOGGER.error("请在 .env 中设置 WATERCRAWL_API_KEY")
        sys.exit(1)

    wc = WaterCrawlClient(
        api_key=api_key,
        base_url=os.getenv("WATERCRAWL_BASE_URL", "http://10.60.151.130:7208"),
    )
    llm = OllamaClient(
        model=args.model,
        base_url=args.ollama_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    )

    crawler = NewsCrawler(
        wc=wc, llm=llm,
        max_depth=args.max_depth,
        max_links=args.max_links,
        max_total=args.max_total,
        same_domain=not args.no_domain_limit,
    )

    t0 = time.perf_counter()
    try:
        result = crawler.run(args.url)
        elapsed = time.perf_counter() - t0

        # 打印报告
        print("\n" + "=" * 60)
        print("金融新闻报告")
        print("=" * 60)
        print(result.get("full_report", "无报告"))
        print(f"\n共分析 {result['total_articles']} 篇文章，耗时 {elapsed:.0f} 秒")

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            LOGGER.info("报告已保存到 %s", args.output)

    except KeyboardInterrupt:
        LOGGER.info("用户中断")
        sys.exit(130)
    except Exception:
        LOGGER.error("运行出错")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
