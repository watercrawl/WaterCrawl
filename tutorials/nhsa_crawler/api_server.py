#!/usr/bin/env python3
"""
国家医保局爬虫 API 服务

供业务方调用的 HTTP 接口，内部集成 WaterCrawl + GPUStack(Qwen3-32B) 爬取医保局官网内容。

接口：
    GET  /api/health              健康检查
    POST /api/nhsa/crawl           提交爬取任务（异步）
    GET  /api/nhsa/crawl/<task_id> 查询任务结果
    POST /api/nhsa/crawl/sync      同步爬取（阻塞等待）

启动：
    python api_server.py --port 7109
    python api_server.py --port 7109 --model qwen3-32b

调用示例：
    # 默认爬取国家医保局
    curl -X POST http://10.60.151.130:7109/api/nhsa/crawl/sync

    # 爬取其他网站
    curl -X POST http://10.60.151.130:7109/api/nhsa/crawl/sync \
      -H "Content-Type: application/json" \
      -d '{"url": "https://www.nhsa.gov.cn", "columns": ["医保动态", "政策", "统计数据"]}'

环境变量（.env）：
    WATERCRAWL_API_KEY      必填
    WATERCRAWL_BASE_URL     默认 http://10.60.151.130:7108
    GPUSTACK_BASE_URL       必填
    GPUSTACK_API_KEY        必填
"""
import argparse
import logging
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from flask import Flask, jsonify, request

from nhsa_crawler import WaterCrawlClient, LLMClient, NhsCrawler

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
LOGGER = logging.getLogger(__name__)

load_dotenv()


# ═══════════════════════════ 任务管理 ═══════════════════════════

class TaskManager:
    """管理异步爬取任务的状态和结果。"""

    def __init__(self, max_workers: int = 1):
        self._tasks: Dict[str, Dict[str, Any]] = {}
        self._lock = Lock()
        self._pool = ThreadPoolExecutor(max_workers=max_workers)

    def create_task(self, kwargs: dict) -> str:
        task_id = uuid.uuid4().hex[:12]
        with self._lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "status": "pending",
                "progress": "任务已创建，等待执行",
                "result": None,
                "error": None,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "finished_at": None,
            }
        self._pool.submit(self._run_task, task_id, kwargs)
        return task_id

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._tasks.get(task_id)

    def _run_task(self, task_id: str, kwargs: dict):
        self._update_task(task_id, "running", "正在爬取医保局官网...", None, None)
        try:
            wc = WaterCrawlClient(
                api_key=kwargs.get("api_key", ""),
                base_url=kwargs.get("base_url", "http://10.60.151.130:7108"),
                delay=kwargs.get("delay", 1.5),
                max_retries=kwargs.get("retries", 3),
            )
            llm = LLMClient(
                model=kwargs.get("model", "qwen3-32b"),
                base_url=kwargs.get("gpustack_url", ""),
                api_key=kwargs.get("gpustack_key", ""),
            )
            crawler = NhsCrawler(
                wc=wc,
                llm=llm,
                homepage_url=kwargs.get("url", "https://www.nhsa.gov.cn"),
                columns=kwargs.get("columns", ["医保动态", "政策", "统计数据"]),
            )
            result = crawler.run()
            self._update_task(task_id, "completed", "爬取完成", result, None)
        except Exception as e:
            LOGGER.error("Task %s failed: %s", task_id, e)
            self._update_task(task_id, "failed", f"运行出错: {str(e)}", None, str(e))

    def _update_task(self, task_id: str, status: str, progress: str,
                     result: Any, error: Optional[str]):
        with self._lock:
            if task_id in self._tasks:
                self._tasks[task_id]["status"] = status
                self._tasks[task_id]["progress"] = progress
                self._tasks[task_id]["result"] = result
                self._tasks[task_id]["error"] = error
                if status in ("completed", "failed"):
                    self._tasks[task_id]["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S")


# ═══════════════════════════ API 服务 ═══════════════════════════

def create_app(api_key: str, base_url: str, gpustack_url: str, gpustack_key: str,
               default_model: str, max_workers: int = 1) -> Flask:
    app = Flask(__name__)
    task_mgr = TaskManager(max_workers=max_workers)

    default_kwargs = {
        "api_key": api_key,
        "base_url": base_url,
        "gpustack_url": gpustack_url,
        "gpustack_key": gpustack_key,
        "model": default_model,
        "url": "https://www.nhsa.gov.cn",
        "columns": ["医保动态", "政策", "统计数据"],
        "delay": 1.5,
        "retries": 3,
    }

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok",
            "service": "nhsa-crawler",
            "model": default_model,
        })

    @app.route("/api/nhsa/crawl", methods=["POST"])
    def submit_crawl():
        """提交爬取任务（异步）。"""
        data = request.get_json(silent=True) or {}
        kwargs = {**default_kwargs}
        for key in ["url", "columns", "delay", "retries", "model"]:
            if key in data:
                kwargs[key] = data[key]

        task_id = task_mgr.create_task(kwargs)
        return jsonify({
            "task_id": task_id,
            "status": "pending",
            "message": "任务已创建，请通过 GET /api/nhsa/crawl/<task_id> 查询结果",
        }), 201

    @app.route("/api/nhsa/crawl/<task_id>", methods=["GET"])
    def get_crawl_result(task_id: str):
        """查询爬取任务状态和结果。"""
        task = task_mgr.get_task(task_id)
        if not task:
            return jsonify({"error": "任务不存在"}), 404

        resp = {
            "task_id": task["task_id"],
            "status": task["status"],
            "progress": task["progress"],
            "created_at": task["created_at"],
            "finished_at": task["finished_at"],
        }
        if task["status"] == "completed":
            resp["result"] = task["result"]
        elif task["status"] == "failed":
            resp["error"] = task["error"]
        return jsonify(resp)

    @app.route("/api/nhsa/crawl/sync", methods=["POST"])
    def crawl_sync():
        """同步爬取（阻塞直到完成）。"""
        data = request.get_json(silent=True) or {}

        homepage_url = data.get("url", "https://www.nhsa.gov.cn")
        columns = data.get("columns", ["医保动态", "政策", "统计数据"])
        model = data.get("model", default_model)
        delay = data.get("delay", 1.5)
        retries = data.get("retries", 3)

        try:
            wc = WaterCrawlClient(
                api_key=api_key, base_url=base_url,
                delay=delay, max_retries=retries,
            )
            llm = LLMClient(model=model, base_url=gpustack_url, api_key=gpustack_key)
            crawler = NhsCrawler(wc=wc, llm=llm, homepage_url=homepage_url, columns=columns)
            result = crawler.run()
            return jsonify({"status": "completed", "result": result})
        except Exception as e:
            return jsonify({"status": "failed", "error": str(e)}), 500

    return app, task_mgr


# ═══════════════════════════ 启动入口 ═══════════════════════════

def main():
    parser = argparse.ArgumentParser(description="国家医保局爬虫 API 服务")
    parser.add_argument("--port", type=int, default=7109, help="监听端口（默认 7109）")
    parser.add_argument("--host", default="0.0.0.0", help="监听地址（默认 0.0.0.0）")
    parser.add_argument("--model", default="qwen3-32b", help="GPUStack 模型名（默认 qwen3-32b）")
    parser.add_argument("--workers", type=int, default=1, help="并行任务数（默认 1）")
    parser.add_argument("--debug", action="store_true", help="调试模式")
    args = parser.parse_args()

    api_key = os.getenv("WATERCRAWL_API_KEY")
    if not api_key:
        LOGGER.error("请在 .env 中设置 WATERCRAWL_API_KEY")
        return

    gpustack_url = os.getenv("GPUSTACK_BASE_URL")
    gpustack_key = os.getenv("GPUSTACK_API_KEY")
    if not gpustack_url:
        LOGGER.error("请在 .env 中设置 GPUSTACK_BASE_URL 和 GPUSTACK_API_KEY")
        return

    base_url = os.getenv("WATERCRAWL_BASE_URL", "http://10.60.151.130:7108")

    app, _ = create_app(
        api_key=api_key,
        base_url=base_url,
        gpustack_url=gpustack_url,
        gpustack_key=gpustack_key,
        default_model=args.model,
        max_workers=args.workers,
    )

    LOGGER.info("=" * 60)
    LOGGER.info("国家医保局爬虫 API 服务启动")
    LOGGER.info("监听地址: http://%s:%d", args.host, args.port)
    LOGGER.info("GPUStack: %s", gpustack_url)
    LOGGER.info("默认模型: %s", args.model)
    LOGGER.info("=" * 60)
    LOGGER.info("")
    LOGGER.info("接口列表:")
    LOGGER.info("  GET  /api/health              健康检查")
    LOGGER.info("  POST /api/nhsa/crawl           提交爬取任务（异步）")
    LOGGER.info("  GET  /api/nhsa/crawl/<id>      查询任务结果")
    LOGGER.info("  POST /api/nhsa/crawl/sync      同步爬取（阻塞等待）")
    LOGGER.info("")
    LOGGER.info("调用示例:")
    LOGGER.info("  # 同步爬取（直接返回结果）")
    LOGGER.info('  curl -X POST http://%s:%d/api/nhsa/crawl/sync', args.host, args.port)
    LOGGER.info("")
    LOGGER.info("  # 异步爬取（先提交，再轮询）")
    LOGGER.info('  curl -X POST http://%s:%d/api/nhsa/crawl \\', args.host, args.port)
    LOGGER.info('    -H "Content-Type: application/json"')
    LOGGER.info('  curl http://%s:%d/api/nhsa/crawl/<task_id>', args.host, args.port)

    app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()
