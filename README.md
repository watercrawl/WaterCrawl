![Water Crawl](https://raw.githubusercontent.com/watercrawl/WaterCrawl/0d60be2a79e8d4ce62ae5c7c77f4f8bdf0113dc9/assets/banner.png)

WaterCrawl is a web application that uses Python, Django, Scrapy, and Celery to crawl web pages and extract relevant
data.

## Installation

### Production Deployment

For production deployment with Docker and complete infrastructure setup, please refer to our dedicated self-hosted
repository:
[WaterCrawl Self-Hosted](https://github.com/watercrawl/self-hosted)

### Local Development and Contributing

For local development and contribution, please follow these steps:

### requirements

- Python version 3.13
- Node.js version 20
- PNPM `corepack enable && corepack prepare pnpm@latest --activate`
- Poetry `curl -sSL https://install.python-poetry.org | python3 -`
- Docker ([instant](https://www.docker.com/get-docker))

1. Clone the repository:

    ```bash
    $ git clone https://github.com/watercrawl/watercrawl.git
    ```

2. Install frontend and backend dependencies:

    ```bash
    $ make install
    ```

3. Start the development requirements containers:

    ```bash
    $ cd docker
    $ cp .env.example .env
    $ docker compose up -d
    ```
   
4. Start backend development server:

    #### Note: you have to run the following commands in separate terminals
    
    ```bash
    $ cd backend
    $ cp app.env.example app.env
    $ poetry run python manage.py runserver
    $ poetry run celery -A watercrawl --beat worker -l info
    ```
   
5. Start frontend development server:

    ```bash
    $ cd frontend
    $ cp .env.example .env
    $ npm run dev
    ```

## Features

- Crawl web pages using Scrapy
- Extract data from crawled pages using Scrapy
- Store extracted data in a database using Django
- Use Celery to run tasks asynchronously
- File storage support (MinIO/S3/Local)
- REST API with OpenAPI documentation
- User authentication and authorization
- Task scheduling with Celery Beat

## Integrations

- [x] Dify Plugin to use in the
  workflow ([Install](https://marketplace.dify.ai/plugins/watercrawl/watercrawl)) ([source code](https://github.com/watercrawl/watercrawl-dify-plugin))
- [x] N8N workflow
  node ([Install](https://www.npmjs.com/package/@watercrawl/n8n-nodes-watercrawl])) ([source code](https://github.com/watercrawl/n8n-nodes-watercrawl))
- [ ] Dify Knowledge Base (Pull Request - Not Merged yet)
- [ ] Langflow (Pull Request - Not Merged yet)
- [ ] Flowise (Comming soon)

## Plugins

- [x] WaterCrawl plugin ()
- [x] OpenAI Plugin

## Star history

[![Star History Chart](https://api.star-history.com/svg?repos=watercrawl/watercrawl&type=Date)](https://star-history.com/#watercrawl/watercrawl&Date)

## Security disclosure

please avoid posting security issues on GitHub. Instead, send your questions to support@watercrawl.dev and we will
provide you with a more detailed answer.

## License

This repository is available under the [WatrerCrawl License](LICENSE), which is essentially MIT with a few additional
restrictions.