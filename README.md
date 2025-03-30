![Water Crawl](https://raw.githubusercontent.com/watercrawl/WaterCrawl/0d60be2a79e8d4ce62ae5c7c77f4f8bdf0113dc9/assets/banner.png)

<div align="center">

[![WaterCrawl](https://img.shields.io/badge/Product-F04438)](https://watercrawl.dev)
[![Pricing](https://img.shields.io/badge/free-pricing?logo=free&color=%20%23155EEF&label=pricing&labelColor=%20%23528bff)](https://watercrawl.dev/pricing)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/watercrawl/watercrawl)](https://github.com/watercrawl/watercrawl/releases)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/watercrawl/watercrawl/lint-pr.yml?label=tests)](https://github.com/watercrawl/watercrawl/actions)
[![Docker Image Version](https://img.shields.io/docker/v/watercrawl/watercrawl?label=docker)](https://hub.docker.com/r/watercrawl/watercrawl)
[![GitHub stars](https://img.shields.io/github/stars/watercrawl/watercrawl)](https://github.com/watercrawl/watercrawl/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/watercrawl/watercrawl)](https://github.com/watercrawl/watercrawl/issues)
[![Python Version](https://img.shields.io/badge/python-3.13-blue)](https://www.python.org/downloads/)

</div>

🕷️ WaterCrawl is a powerful web application that uses Python, Django, Scrapy, and Celery to crawl web pages and extract relevant data.

## 🚀 Quick Start

You have 3 options to install WaterCrawl:

1. 🐳 [Build and Run **(Running on Docker locally)**](#build-and-run-running-on-docker-locally)
2. 💻 [Development **(For Contributing)**](./CONTRIBUTING.md)
3. 🌐 [Self-Hosted **(For Production)**](https://github.com/watercrawl/self-hosted)

### 🐳 Build and Run (Running on Docker locally)

To build and run WaterCrawl on Docker locally, please follow these steps:

1. Clone the repository:
    ```bash
    $ git clone https://github.com/watercrawl/watercrawl.git
    ```

2. Build and run the Docker containers:
    ```bash
    $ cd docker
    $ cp .env.example .env
    $ docker compose up -d
    ```

### 💻 Development (For Contributing)

For local development and contribution, please follow our [Contributing Guide](./CONTRIBUTING.md) 🤝

### 🌐 Production Deployment

For production deployment with Docker and complete infrastructure setup, please refer to our dedicated [self-hosted repository](https://github.com/watercrawl/self-hosted) 🚀

## ✨ Features

- 🕷️ Crawl web pages using Scrapy
- 📊 Extract data from crawled pages using Scrapy
- 💾 Store extracted data in a database using Django
- ⚡ Use Celery to run tasks asynchronously
- 📁 File storage support (MinIO/S3/Local)
- 🔄 REST API with OpenAPI documentation
- 🔐 User authentication and authorization
- ⏰ Task scheduling with Celery Beat

## 🔌 Integrations

- ✅ [Dify Plugin](https://marketplace.dify.ai/plugins/watercrawl/watercrawl) ([source code](https://github.com/watercrawl/watercrawl-dify-plugin))
- ✅ [N8N workflow node](https://www.npmjs.com/package/@watercrawl/n8n-nodes-watercrawl) ([source code](https://github.com/watercrawl/n8n-nodes-watercrawl))
- 🔄 Dify Knowledge Base (Pull Request - Not Merged yet)
- 🔄 Langflow (Pull Request - Not Merged yet)
- 🔜 Flowise (Coming soon)

## 🔧 Plugins

- ✅ WaterCrawl plugin
- ✅ OpenAI Plugin

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=watercrawl/watercrawl&type=Date)](https://star-history.com/#watercrawl/watercrawl&Date)

## 🔒 Security Disclosure

⚠️ Please avoid posting security issues on GitHub. Instead, send your questions to support@watercrawl.dev and we will provide you with a more detailed answer.

## 📄 License

This repository is available under the [WaterCrawl License](LICENSE), which is essentially MIT with a few additional restrictions.

---
<div align="center">
Made with ❤️ by the WaterCrawl Team
</div>