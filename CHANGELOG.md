# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2024-12-16

### Added
- Initial release of WaterCrawl
- Core web crawling functionality using Scrapy (v2.12.0)
- Django-based web application (v5.1.4)
- REST API using Django REST Framework (v3.15.2)
- Asynchronous task processing with Celery (v5.4.0)
- Redis integration for task queue management
- MinIO integration for file storage
- User authentication and authorization system
- OpenAI integration capabilities
- Docker support with multi-container setup
- Swagger/OpenAPI documentation using drf-spectacular

### Features
- Web page crawling and data extraction
- Asynchronous task management
- User management system
- API documentation
- Containerized deployment support
- Scalable architecture with separate services
- Database integration with PostgreSQL
- File storage system using MinIO
- Celery beat for scheduled tasks

### Dependencies
- Python 3.11+
- Django 5.1.4
- Scrapy 2.12.0
- Celery 5.4.0
- Redis (latest)
- PostgreSQL 17.2
- Nginx
- GunicornWSGI server
- MinIO (optional, can use S3 or local storage)
- Additional dependencies listed in requirements.txt

### Infrastructure Components
- Web Application Server (Gunicorn)
- Celery Worker with Beat Scheduler
- Nginx Web Server
- PostgreSQL Database
- Redis for Caching and Message Broker
- MinIO/S3 for Object Storage (optional)

[0.0.1]: https://github.com/watercrawl/watercrawl/releases/tag/0.0.1
