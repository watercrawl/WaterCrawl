# 国家医保局爬虫 API 文档

## 基本信息

| 项目 | 值 |
|------|-----|
| **服务名** | nhsa-crawler |
| **Base URL** | `http://10.60.151.130:7109` |
| **数据格式** | JSON（请求和响应均为 `application/json`） |
| **认证方式** | 无（内网服务，暂不鉴权） |

---

## 接口列表

### 1. 健康检查

| 方法 | 路径 |
|------|------|
| `GET` | `/api/health` |

**响应示例：**
```json
{
  "status": "ok",
  "service": "nhsa-crawler",
  "model": "qwen3-32b"
}
```

---

### 2. 同步爬取（推荐，最简方式）

直接提交并阻塞等待结果，适合单次调用。

| 方法 | 路径 |
|------|------|
| `POST` | `/api/nhsa/crawl/sync` |

**请求参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:--:|--------|------|
| `url` | string | 否 | `https://www.nhsa.gov.cn` | 目标网站首页 URL |
| `columns` | array | 否 | `["医保动态","政策","统计数据"]` | 要爬取的栏目名称（3个） |
| `model` | string | 否 | `qwen3-32b` | GPUStack 模型名 |
| `delay` | float | 否 | `1.5` | 请求间隔（秒） |
| `retries` | int | 否 | `3` | 失败重试次数 |

**请求示例（默认爬取医保局）：**
```bash
curl -X POST http://10.60.151.130:7109/api/nhsa/crawl/sync
```

**请求示例（自定义网站和栏目）：**
```bash
curl -X POST http://10.60.151.130:7109/api/nhsa/crawl/sync \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.nhsa.gov.cn",
    "columns": ["医保动态", "政策", "统计数据"],
    "delay": 2,
    "retries": 5
  }'
```

**响应结构：**
```json
{
  "status": "completed",
  "result": {
    "爬取时间": "2026-07-07 10:30:00",
    "数据来源": "https://www.nhsa.gov.cn",
    "栏目覆盖": [
      {"栏目": "医保动态", "状态": "找到", "列表页URL": "https://..."},
      {"栏目": "政策", "状态": "找到", "列表页URL": "https://..."},
      {"栏目": "统计数据", "状态": "找到", "列表页URL": "https://..."}
    ],
    "文章总数": 45,
    "按栏目": {
      "医保动态": {
        "数量": 20,
        "文章": [
          {
            "所属栏目": "医保动态",
            "文章标题": "国家医保局关于...的通知",
            "发布日期": "2026-07-01",
            "详情页URL": "https://www.nhsa.gov.cn/art/2026/7/1/art_xxx.html",
            "正文内容": "全文正文...",
            "附件链接": ["https://www.nhsa.gov.cn/xxx.pdf"],
            "附件详情": [{"url": "https://...", "filename": "通知.pdf"}]
          }
        ]
      },
      "政策": {"数量": 15, "文章": [...]},
      "统计数据": {"数量": 10, "文章": [...]}
    },
    "全部文章": [
      {
        "所属栏目": "医保动态",
        "文章标题": "...",
        "发布日期": "2026-07-01",
        "详情页URL": "https://...",
        "正文内容": "...",
        "附件链接": [...]
      }
    ],
    "执行耗时_秒": 120.5
  }
}
```

---

### 3. 异步爬取（提交任务）

先提交任务拿到 task_id，再轮询结果。适合后台定时任务或避免长连接超时。

#### 3.1 提交任务

| 方法 | 路径 |
|------|------|
| `POST` | `/api/nhsa/crawl` |

**请求参数：** 同同步接口。

**请求示例：**
```bash
curl -X POST http://10.60.151.130:7109/api/nhsa/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.nhsa.gov.cn",
    "columns": ["医保动态", "政策", "统计数据"]
  }'
```

**响应：**
```json
{
  "task_id": "a1b2c3d4e5f6",
  "status": "pending",
  "message": "任务已创建，请通过 GET /api/nhsa/crawl/<task_id> 查询结果"
}
```

#### 3.2 查询任务结果

| 方法 | 路径 |
|------|------|
| `GET` | `/api/nhsa/crawl/{task_id}` |

**请求示例：**
```bash
curl http://10.60.151.130:7109/api/nhsa/crawl/a1b2c3d4e5f6
```

**响应（执行中）：**
```json
{
  "task_id": "a1b2c3d4e5f6",
  "status": "running",
  "progress": "正在爬取医保局官网...",
  "created_at": "2026-07-07 10:30:00",
  "finished_at": null
}
```

**响应（完成）：**
```json
{
  "task_id": "a1b2c3d4e5f6",
  "status": "completed",
  "progress": "爬取完成",
  "created_at": "2026-07-07 10:30:00",
  "finished_at": "2026-07-07 10:32:01",
  "result": { ... }
}
```

**响应（失败）：**
```json
{
  "task_id": "a1b2c3d4e5f6",
  "status": "failed",
  "progress": "运行出错: connection timeout",
  "error": "connection timeout",
  "created_at": "2026-07-07 10:30:00",
  "finished_at": "2026-07-07 10:30:30"
}
```

---

## 状态码说明

| HTTP Code | 说明 |
|-----------|------|
| `200` | 成功（查询/同步爬取） |
| `201` | 任务创建成功（异步提交） |
| `400` | 请求参数错误 |
| `404` | 任务不存在 |
| `500` | 服务器内部错误 |

---

## 工作原理

```
POST /api/nhsa/crawl/sync
        │
        ├─ ① WaterCrawl 爬取首页 → 获取 markdown
        ├─ ② GPUStack(Qwen3-32B) 识别栏目「更多>>」链接
        ├─ ③ WaterCrawl 逐栏目爬取列表第一页
        ├─ ④ GPUStack 提取文章条目（标题、日期、URL）
        ├─ ⑤ WaterCrawl 逐篇爬取详情页正文
        ├─ ⑥ GPUStack / 正则提取正文 + 附件
        └─ ⑦ 返回结构化 JSON
```

---

## 启动服务

```bash
cd ~/mbrtest/WaterCrawl_test/tutorials/nhsa_crawler

# 前台测试
python api_server.py --port 7109

# 后台运行
nohup python api_server.py --port 7109 > server.log 2>&1 &
```

## 环境变量 (.env)

```env
WATERCRAWL_API_KEY=你的key
WATERCRAWL_BASE_URL=http://10.60.151.130:7108
GPUSTACK_BASE_URL=https://你的gpustack地址
GPUSTACK_API_KEY=你的key
```
