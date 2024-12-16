# WaterCrawl

WaterCrawl is a web application that uses Python, Django, Scrapy, and Celery to crawl web pages and extract relevant data.

## ⚠️ Disclaimer
This project is currently in beta. It is provided "as is" without warranty of any kind, express or implied. Users assume all risks and responsibilities for deployment, operation, and maintenance. The developers are not liable for any damages or issues arising from the use of this software.

## Features

- Crawl web pages using Scrapy
- Extract data from crawled pages using Scrapy
- Store extracted data in a database using Django
- Use Celery to run tasks asynchronously
- File storage support (MinIO/S3/Local)
- REST API with OpenAPI documentation
- User authentication and authorization
- Task scheduling with Celery Beat

## Requirements

### Core Dependencies
- Python 3.11+
- PostgreSQL 17.2
- Redis (latest)
- Nginx
- MinIO (optional)

### Python Packages
- Django 5.1.4
- Scrapy 2.12.0
- Celery 5.4.0
- Additional dependencies in requirements.txt

## Installation

### Production Deployment
For production deployment with Docker and complete infrastructure setup, please refer to our dedicated self-hosted repository:
[WaterCrawl Self-Hosted](https://github.com/watercrawl/self-hosted)


### Manual Installation
1. Clone the repository
2. Create and activate a virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Configure environment variables
5. Run migrations: `python manage.py migrate`
6. Start the development server: `python manage.py runserver`

## Configuration

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection URL
- `REDIS_URL`: Redis connection URL
- `SECRET_KEY`: Django secret key
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

### Optional Environment Variables
- `STORAGE_BACKEND`: Choose between 'minio', 's3', or 'local'
- `MINIO_*`: MinIO configuration (if using MinIO)
- `AWS_*`: AWS configuration (if using S3)

## Development

For local development:
1. Start required services (PostgreSQL, Redis)
2. Run migrations
3. Create a superuser: `python manage.py createsuperuser`
4. Start the development server
5. Start Celery worker: `celery -A watercrawl worker -l info`
6. Start Celery beat: `celery -A watercrawl beat -l info -S django`