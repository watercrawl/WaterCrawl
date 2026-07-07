#!/usr/bin/env python3
"""
国家医保局官网内容爬虫 —— nhsa_crawler

目标：抓取国家医保局官网「医保动态」「政策」「统计数据」3 个栏目的最新文章

流程：
    1. 爬取首页 → GPUStack 识别 3 个栏目的「更多>>」链接
    2. 逐栏目爬取列表第一页 → GPUStack 提取文章条目（标题、日期、URL）
    3. 逐篇爬取文章详情页 → 提取正文 + 附件链接

用法：
    python nhsa_crawler.py
    python nhsa_crawler.py --url https://www.nhsa.gov.cn --delay 2 --retries 3 --output result.json

环境变量（.env）：
    WATERCRAWL_API_KEY      必填
    WATERCRAWL_BASE_URL     默认 http://10.60.151.130:7108
    GPUSTACK_BASE_URL       必填
    GPUSTACK_API_KEY        必填
"""
import argparse
import json
import logging
import os
import sys
import time
import traceback
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
LOGGER = logging.getLogger(__name__)

# ── 配置 ──────────────────────────────────────────────
DEFAULT_HOMEPAGE = "https://www.nhsa.gov.cn"
TARGET_COLUMNS = ["医保动态", "政策", "统计数据"]
REQUEST_DELAY = 1.5          # 秒，API 调用最小间隔
MAX_RETRIES = 3              # 单次 API 调用最多重试次数
CRAWL_TIMEOUT = 120          # 单次爬取超时（秒）


# ═══════════════════════════ 客户端封装 ═══════════════════════════

class WaterCrawlClient:
    """封装 WaterCrawl API，内置重试和间隔控制。"""

    def __init__(self, api_key: str, base_url: str = "http://10.60.151.130:7108",
                 delay: float = REQUEST_DELAY, max_retries: int = MAX_RETRIES):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.delay = delay
        self.max_retries = max_retries
        self._last_call = 0.0
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {api_key}"})

    def _rate_limit(self):
        """确保两次请求间隔 >= delay。"""
        elapsed = time.time() - self._last_call
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)

    def scrape_url(self, url: str, page_options: Optional[Dict] = None) -> Optional[Dict]:
        """爬取单个 URL，返回 {markdown, title, links, ...}。"""
        if page_options is None:
            page_options = {
                "only_main_content": True,
                "include_html": False,
                "include_links": True,
                "wait_time": 1,
            }

        payload = {"url": url, "crawl_type": "single", "page_options": page_options}

        for attempt in range(1, self.max_retries + 1):
            self._rate_limit()
            try:
                resp = self.session.post(
                    f"{self.base_url}/api/v1/core/crawl-requests/",
                    json=payload,
                    timeout=30,
                )
                resp.raise_for_status()
                req_id = resp.json().get("uuid")
                if not req_id:
                    LOGGER.warning("未获取到 UUID，重试 %d/%d", attempt, self.max_retries)
                    continue
                result = self._poll_result(req_id)
                if result:
                    return result
                LOGGER.warning("爬取返回空结果，重试 %d/%d", attempt, self.max_retries)
            except requests.RequestException as e:
                LOGGER.warning("请求失败 (%d/%d): %s", attempt, self.max_retries, e)
                if attempt < self.max_retries:
                    time.sleep(2 * attempt)
        LOGGER.error("爬取 %s 最终失败", url)
        return None

    def _poll_result(self, req_id: str, timeout: int = CRAWL_TIMEOUT) -> Optional[Dict]:
        """轮询直到任务完成。"""
        deadline = time.time() + timeout
        while time.time() < deadline:
            time.sleep(2)
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
        LOGGER.warning("爬取 %s 超时", req_id)
        return None


class LLMClient:
    """GPUStack 客户端（OpenAI 兼容 API）。"""

    def __init__(self, model: str = "qwen3-32b", base_url: str = "", api_key: str = ""):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def ask(self, prompt: str, system: Optional[str] = None, temperature: float = 0.1) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            resp = requests.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json={"model": self.model, "messages": messages, "temperature": temperature},
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            LOGGER.error("GPUStack 请求失败: %s", e)
            return ""


# ═══════════════════════════ Prompt 模板 ═══════════════════════════

SYSTEM_PROMPT = """你是一个网页内容结构化提取助手。你的任务是从网页文本中精准提取指定的结构化信息。
所有输出必须是严格的 JSON 格式，不要包含任何解释性文字。"""

PROMPT_FIND_COLUMNS = """从以下网站首页的内容和链接中，找出 **{columns}** 这 3 个栏目的「更多>>」跳转链接。

首页内容（markdown + 链接列表）：
{content}

请返回如下 JSON（不要带 markdown 代码块标记）：
{{
  "医保动态": {{
    "found": true 或 false,
    "list_url": "列表页完整 URL（点击「更多>>」后的地址）"
  }},
  "政策": {{
    "found": true 或 false,
    "list_url": "列表页完整 URL"
  }},
  "统计数据": {{
    "found": true 或 false,
    "list_url": "列表页完整 URL"
  }}
}}

规则：
1. 仔细阅读内容，找到导航/栏目区域中对「医保动态」「政策」「统计数据」的描述
2. 每个栏目后面通常有「更多>>」或「更多」或类似跳转链接，选择指向列表页的那个链接
3. URL 必须是绝对地址（如相对路径请用 https://www.nhsa.gov.cn 补全）
4. 如果确实找不到某个栏目，found 设为 false
5. 只选择最可能的 1 个 URL 给每个栏目"""

PROMPT_PARSE_LIST = """从以下栏目列表页内容中，提取所有文章条目。每个条目包含：标题、发布日期、详情页链接。

所属栏目：{column_name}
列表页 URL：{list_url}

列表页内容（markdown + 链接列表）：
{content}

请返回如下 JSON：
{{
  "articles": [
    {{
      "title": "文章标题全文",
      "date": "YYYY-MM-DD 格式的发布日期",
      "detail_url": "文章详情页完整 URL"
    }}
  ]
}}

规则：
1. 提取列表页中所有文章条目（通常以 <li>、标题链接等形式呈现）
2. 如果页面有分页指示器，只提取当前页的文章，不提取其他页
3. 日期统一为 YYYY-MM-DD 格式，如果原文格式不同请归一化
4. URL 必须是绝对地址
5. 如果某些文章缺少日期，date 字段留空字符串 ""
6. 按列表中的出现顺序排列"""

PROMPT_PARSE_ARTICLE = """从以下文章详情页内容中，提取正文和附件链接。

文章标题：{title}
所属栏目：{column_name}
详情页 URL：{detail_url}

详情页内容（markdown）：
{content}

请返回如下 JSON：
{{
  "full_text": "文章完整正文纯文本，保留段落换行",
  "attachments": [
    {{
      "url": "附件完整下载地址",
      "filename": "附件文件名（含扩展名）"
    }}
  ]
}}

规则：
1. full_text 提取文章主体正文（排除导航、页脚、侧边栏等非正文内容）
2. attachments 提取正文中引用的 PDF、Word、Excel 等文档链接
3. 如果没有附件，attachments 为空数组 []
4. URL 必须是绝对地址"""


# ═══════════════════════════ 核心爬虫 ═══════════════════════════

@dataclass
class ArticleRecord:
    """单篇文章的采集结果。"""
    column: str          # 所属栏目
    title: str           # 文章标题
    date: str            # 发布日期
    detail_url: str      # 详情页 URL（主键）
    full_text: str       # 正文内容
    attachments: List[Dict]  # 附件列表


@dataclass
class ColumnConfig:
    """栏目配置。"""
    name: str
    list_url: str
    found: bool


@dataclass
class NhsCrawler:
    """国家医保局官网爬虫。"""

    wc: WaterCrawlClient
    llm: LLMClient
    homepage_url: str = DEFAULT_HOMEPAGE
    columns: List[str] = field(default_factory=lambda: list(TARGET_COLUMNS))

    _column_configs: List[ColumnConfig] = field(default_factory=list)
    _records: List[ArticleRecord] = field(default_factory=list)

    # ── 解析工具 ──────────────────────────────────────

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
            LOGGER.warning("JSON 解析失败，原文: %s", text[:200])
            return {}

    @staticmethod
    def _extract_content(result: Dict) -> Tuple[str, str, List[Dict]]:
        """从 WaterCrawl 结果中提取 markdown / title / links。"""
        markdown = (result.get("markdown") or
                    result.get("result", {}).get("markdown") or "")
        title = (result.get("title") or
                 result.get("result", {}).get("metadata", {}).get("title") or "")
        links = (result.get("links") or
                 result.get("result", {}).get("links") or [])
        return markdown, title, links

    # ── 步骤 1：从首页识别栏目链接 ──────────────────────

    def _step_find_columns(self) -> List[ColumnConfig]:
        """爬取首页，用 LLM 识别 3 个栏目的列表页入口。"""
        LOGGER.info("=" * 60)
        LOGGER.info("步骤 1/4：爬取首页，识别栏目入口")
        LOGGER.info("=" * 60)
        LOGGER.info("首页 URL: %s", self.homepage_url)

        result = self.wc.scrape_url(self.homepage_url)
        if not result:
            LOGGER.error("首页爬取失败，无法继续")
            return []

        markdown, title, links = self._extract_content(result)
        LOGGER.info("首页内容: %d 字符，链接: %d 个", len(markdown), len(links))

        # 构造 prompt 用的内容摘要（链接列表 + 前 8000 字符正文）
        links_text = "\n".join([
            f"- {l.get('text', '')}: {l.get('url', '')}"
            for l in links[:200]
        ]) if links else "(无链接)"
        content_snapshot = f"## 页面正文（markdown）\n{markdown[:8000]}\n\n## 链接列表\n{links_text}"

        columns_str = "、".join(self.columns)
        response = self.llm.ask(
            PROMPT_FIND_COLUMNS.format(columns=columns_str, content=content_snapshot),
            system=SYSTEM_PROMPT,
        )
        data = self._parse_json(response)

        configs = []
        for col_name in self.columns:
            col_data = data.get(col_name, {})
            found = col_data.get("found", False)
            list_url = col_data.get("list_url", "")
            if found and list_url:
                LOGGER.info("  ✓ [%s] 找到: %s", col_name, list_url)
            else:
                LOGGER.warning("  ✗ [%s] 未找到", col_name)
            configs.append(ColumnConfig(name=col_name, list_url=list_url, found=found))

        self._column_configs = configs
        return configs

    # ── 步骤 2：爬取列表页，提取文章条目 ────────────────

    def _step_parse_list(self, config: ColumnConfig) -> List[Dict]:
        """爬取某个栏目的列表页，用 LLM 提取文章列表。"""
        LOGGER.info("-" * 40)
        LOGGER.info("步骤 2/4：解析 [%s] 列表页", config.name)
        LOGGER.info("列表页 URL: %s", config.list_url)

        result = self.wc.scrape_url(config.list_url)
        if not result:
            LOGGER.error("  ✗ [%s] 列表页爬取失败", config.name)
            return []

        markdown, _, links = self._extract_content(result)
        LOGGER.info("  [%s] 列表页: %d 字符，链接: %d 个", config.name, len(markdown), len(links))

        links_text = "\n".join([
            f"- {l.get('text', '')}: {l.get('url', '')}"
            for l in links[:200]
        ]) if links else "(无链接)"
        content_snapshot = f"## 页面正文\n{markdown[:8000]}\n\n## 链接列表\n{links_text}"

        response = self.llm.ask(
            PROMPT_PARSE_LIST.format(
                column_name=config.name,
                list_url=config.list_url,
                content=content_snapshot,
            ),
            system=SYSTEM_PROMPT,
        )
        data = self._parse_json(response)
        articles = data.get("articles", [])
        LOGGER.info("  [%s] 提取到 %d 篇文章", config.name, len(articles))
        return articles

    # ── 步骤 3：逐篇爬取详情页 ──────────────────────────

    def _step_crawl_detail(self, column_name: str, article_item: Dict) -> Optional[ArticleRecord]:
        """爬取单篇文章详情页，提取正文和附件。"""
        title = article_item.get("title", "")
        date = article_item.get("date", "")
        detail_url = article_item.get("detail_url", "")

        if not detail_url:
            LOGGER.warning("  ✗ 缺少详情页 URL，跳过: %s", title)
            return None

        LOGGER.debug("  爬取详情: %s", title[:40])
        result = self.wc.scrape_url(detail_url)
        if not result:
            LOGGER.warning("  ✗ 详情页爬取失败: %s", detail_url)
            return ArticleRecord(
                column=column_name, title=title, date=date,
                detail_url=detail_url, full_text="[爬取失败]", attachments=[],
            )

        markdown, page_title, _ = self._extract_content(result)
        if not title:
            title = page_title

        # 正文较短时直接取 markdown，较长时用 LLM 提取
        if len(markdown) <= 3000:
            full_text = markdown
            attachments = self._extract_attachment_links(markdown, detail_url)
        else:
            LOGGER.debug("  正文较长(%d字符)，用 LLM 提取...", len(markdown))
            response = self.llm.ask(
                PROMPT_PARSE_ARTICLE.format(
                    title=title, column_name=column_name,
                    detail_url=detail_url, content=markdown[:10000],
                ),
                system=SYSTEM_PROMPT,
            )
            data = self._parse_json(response)
            full_text = data.get("full_text", markdown)
            attachments = data.get("attachments", [])
            if not attachments:
                attachments = self._extract_attachment_links(markdown, detail_url)

        return ArticleRecord(
            column=column_name, title=title, date=date,
            detail_url=detail_url, full_text=full_text, attachments=attachments,
        )

    @staticmethod
    def _extract_attachment_links(markdown: str, base_url: str) -> List[Dict]:
        """从 markdown 中提取 PDF/Word/Excel 附件链接。"""
        import re
        attrs = []
        extensions = ('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.ppt', '.pptx')
        for match in re.finditer(r'\[([^\]]*?\.\w{3,4})\]\((https?://[^)]+)\)', markdown, re.IGNORECASE):
            url = match.group(2)
            filename = match.group(1)
            if any(url.lower().endswith(ext) for ext in extensions) or \
               any(filename.lower().endswith(ext) for ext in extensions):
                attrs.append({"url": url, "filename": filename})
        # 也匹配直接出现的附件 URL
        for match in re.finditer(r'(https?://[^\s<>"]+?\.(?:pdf|docx?|xlsx?|zip|rar|pptx?))', markdown, re.IGNORECASE):
            url = match.group(1)
            if url not in {a["url"] for a in attrs}:
                attrs.append({"url": url, "filename": url.split("/")[-1]})
        return attrs

    # ── 步骤 4：生成结果 ────────────────────────────────

    def _step_generate_output(self) -> Dict[str, Any]:
        """生成最终输出 JSON。"""
        by_column = {}
        for col in self.columns:
            by_column[col] = []

        for r in self._records:
            item = {
                "所属栏目": r.column,
                "文章标题": r.title,
                "发布日期": r.date,
                "详情页URL": r.detail_url,
                "正文内容": r.full_text,
                "附件链接": [a.get("url", "") for a in r.attachments],
                "附件详情": r.attachments,
            }
            by_column.setdefault(r.column, []).append(item)

        return {
            "爬取时间": time.strftime("%Y-%m-%d %H:%M:%S"),
            "数据来源": self.homepage_url,
            "栏目覆盖": [
                {"栏目": c.name, "状态": "找到" if c.found else "未找到", "列表页URL": c.list_url}
                for c in self._column_configs
            ],
            "文章总数": len(self._records),
            "按栏目": {
                col: {"数量": len(items), "文章": items}
                for col, items in by_column.items()
            },
            "全部文章": [
                {
                    "所属栏目": r.column,
                    "文章标题": r.title,
                    "发布日期": r.date,
                    "详情页URL": r.detail_url,
                    "正文内容": r.full_text,
                    "附件链接": [a.get("url", "") for a in r.attachments],
                }
                for r in self._records
            ],
        }

    # ── 主流程 ──────────────────────────────────────────

    def run(self) -> Dict[str, Any]:
        """执行完整爬取流程。"""
        t0 = time.perf_counter()
        LOGGER.info("=" * 60)
        LOGGER.info("国家医保局官网爬虫启动")
        LOGGER.info("目标栏目: %s", "、".join(self.columns))
        LOGGER.info("首页 URL: %s", self.homepage_url)
        LOGGER.info("模型: %s", self.llm.model)
        LOGGER.info("请求间隔: %.1fs | 重试次数: %d", self.wc.delay, self.wc.max_retries)
        LOGGER.info("=" * 60)

        # ── 步骤 1：找到栏目列表页入口 ──
        configs = self._step_find_columns()
        active_configs = [c for c in configs if c.found]
        if not active_configs:
            LOGGER.error("未找到任何目标栏目，退出")
            return {"error": "未找到目标栏目", "columns": []}

        # ── 步骤 2-3：逐栏目 → 列表 → 文章详情 ──
        for config in active_configs:
            LOGGER.info("")
            LOGGER.info(">>> 处理栏目: [%s] <<<", config.name)

            articles = self._step_parse_list(config)
            if not articles:
                LOGGER.warning("  [%s] 未提取到文章条目，跳过", config.name)
                continue

            LOGGER.info("步骤 3/4：逐篇爬取 [%s] 的 %d 篇文章详情", config.name, len(articles))
            for i, item in enumerate(articles, 1):
                LOGGER.info("  [%s] 第 %d/%d 篇: %s",
                            config.name, i, len(articles), item.get("title", "")[:40])
                record = self._step_crawl_detail(config.name, item)
                if record:
                    self._records.append(record)

        # ── 步骤 4：生成输出 ──
        LOGGER.info("")
        LOGGER.info("步骤 4/4：生成输出结果")
        output = self._step_generate_output()

        elapsed = time.perf_counter() - t0
        output["执行耗时_秒"] = round(elapsed, 1)

        LOGGER.info("=" * 60)
        LOGGER.info("爬取完成！")
        LOGGER.info("文章总数: %d", len(self._records))
        for col in self.columns:
            count = sum(1 for r in self._records if r.column == col)
            LOGGER.info("  [%s]: %d 篇", col, count)
        LOGGER.info("总耗时: %.1f 秒", elapsed)
        LOGGER.info("=" * 60)

        return output


# ═══════════════════════════ 命令行入口 ═══════════════════════════

def main():
    parser = argparse.ArgumentParser(description="国家医保局官网内容爬虫")
    parser.add_argument("--url", default=DEFAULT_HOMEPAGE, help=f"首页 URL（默认 {DEFAULT_HOMEPAGE}）")
    parser.add_argument("--columns", nargs=3, default=TARGET_COLUMNS, help="目标栏目名（3个）")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY, help=f"请求间隔秒数（默认 {REQUEST_DELAY}）")
    parser.add_argument("--retries", type=int, default=MAX_RETRIES, help=f"重试次数（默认 {MAX_RETRIES}）")
    parser.add_argument("--timeout", type=int, default=CRAWL_TIMEOUT, help=f"单次爬取超时秒数（默认 {CRAWL_TIMEOUT}）")
    parser.add_argument("--model", default="qwen3-32b", help="GPUStack 模型名")
    parser.add_argument("--output", default="nhsa_result.json", help="输出 JSON 文件路径")
    parser.add_argument("-v", "--verbose", action="store_true", help="调试日志")
    args = parser.parse_args()

    if args.verbose:
        LOGGER.setLevel(logging.DEBUG)

    load_dotenv()

    # ── 校验配置 ──
    api_key = os.getenv("WATERCRAWL_API_KEY")
    if not api_key:
        LOGGER.error("请在 .env 中设置 WATERCRAWL_API_KEY")
        sys.exit(1)

    gpustack_url = os.getenv("GPUSTACK_BASE_URL")
    gpustack_key = os.getenv("GPUSTACK_API_KEY")
    if not gpustack_url:
        LOGGER.error("请在 .env 中设置 GPUSTACK_BASE_URL 和 GPUSTACK_API_KEY")
        sys.exit(1)

    base_url = os.getenv("WATERCRAWL_BASE_URL", "http://10.60.151.130:7108")

    # ── 构建爬虫 ──
    wc = WaterCrawlClient(
        api_key=api_key, base_url=base_url,
        delay=args.delay, max_retries=args.retries,
    )
    llm = LLMClient(model=args.model, base_url=gpustack_url, api_key=gpustack_key)

    crawler = NhsCrawler(
        wc=wc, llm=llm,
        homepage_url=args.url,
        columns=list(args.columns),
    )

    # ── 执行 ──
    try:
        result = crawler.run()

        # 打印缩略结果
        print("\n" + "=" * 60)
        print("采集结果摘要")
        print("=" * 60)
        for col_detail in result.get("栏目覆盖", []):
            print(f"  {col_detail['栏目']}: {col_detail['状态']}")
        print(f"\n文章总数: {result.get('文章总数', 0)}")
        for col_name, col_data in result.get("按栏目", {}).items():
            print(f"  {col_name}: {col_data['数量']} 篇")
        print(f"执行耗时: {result.get('执行耗时_秒', 0)} 秒")

        # 保存文件
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        LOGGER.info("结果已保存到 %s", args.output)

    except KeyboardInterrupt:
        LOGGER.info("用户中断")
        sys.exit(130)
    except Exception:
        LOGGER.error("运行出错")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
