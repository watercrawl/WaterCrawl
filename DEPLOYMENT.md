# WaterCrawl Deployment Guide

This document provides detailed instructions for deploying the WaterCrawl application using Docker. It explains each environment variable and walks you through setting them up step by step.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
  - [General Settings](#general-settings)
  - [Django Core Settings](#django-core-settings)
  - [Database Settings](#database-settings)
  - [Redis Settings](#redis-settings)
  - [JWT Settings](#jwt-settings)
  - [MinIO Settings](#minio-settings)
  - [CORS Settings](#cors-settings)
  - [Authentication Settings](#authentication-settings)
  - [Email Settings](#email-settings)
  - [Scrapy Settings](#scrapy-settings)
  - [Playwright Settings](#playwright-settings)
  - [Integration Settings](#integration-settings)
  - [Feature Flags](#feature-flags)
  - [Frontend Settings](#frontend-settings)
- [Deployment Steps](#deployment-steps)
- [Accessing Services](#accessing-services)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying WaterCrawl, ensure you have the following installed:

- Docker Engine (20.10.0+)
- Docker Compose (2.0.0+)
- Git

## Quick Start

For a quick start with default settings:

1. Clone the repository:
   ```bash
   git clone https://github.com/watercrawl/watercrawl.git
   cd watercrawl
   ```

2. Copy the example environment file:
   ```bash
   cp docker/.env.example docker/.env
   ```

3. Start the services:
   ```bash
   cd docker
   docker-compose up -d
   ```

4. Access the application at:
   - Frontend: http://localhost
   - API: http://localhost/api
   - MinIO Console: http://localhost/minio-console

## Environment Configuration

WaterCrawl uses environment variables for configuration. All variables have sensible defaults in `docker-compose.yml`, but you can override them in a `.env` file.

### General Settings

These settings control basic Docker and version information:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `VERSION` | Application version | `v0.6.0` | No |
| `NGINX_PORT` | Port for the Nginx service | `80` | No |

**Setup Steps:**
1. Decide which port you want to expose the application on
2. If port 80 is already in use, change `NGINX_PORT` to another value like 8080

### Django Core Settings

These settings control the Django backend application:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `SECRET_KEY` | Django secret key for security | *Long string* | **Yes** for production |
| `DEBUG` | Debug mode (set to False in production) | `True` | No |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts | `*` | No |
| `LANGUAGE_CODE` | Language code | `en-us` | No |
| `TIME_ZONE` | Time zone | `UTC` | No |
| `USE_I18N` | Enable internationalization | `True` | No |
| `USE_TZ` | Enable timezone support | `True` | No |
| `STATIC_ROOT` | Static files directory | `storage/static/` | No |
| `MEDIA_ROOT` | Media files directory | `storage/media/` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |
| `FRONTEND_URL` | Frontend URL for CORS and redirects | `http://localhost` | No |

**Setup Steps:**
1. For production, generate a secure random SECRET_KEY:
   ```bash
   openssl rand -base64 32
   ```
2. Set `DEBUG=False` for production environments
3. Set `ALLOWED_HOSTS` to your domain name(s), e.g., `example.com,www.example.com`
4. Set `TIME_ZONE` to your local time zone, e.g., `Europe/Berlin`
5. Set `FRONTEND_URL` to your frontend domain (used for email links and redirects)

### Database Settings

These settings control the PostgreSQL database:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `POSTGRES_HOST` | PostgreSQL host | `db` | No |
| `POSTGRES_PORT` | PostgreSQL port | `5432` | No |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` | **Yes** for production |
| `POSTGRES_USER` | PostgreSQL username | `postgres` | No |
| `POSTGRES_DB` | PostgreSQL database name | `postgres` | No |

**Setup Steps:**
1. For production, set a strong `POSTGRES_PASSWORD`
2. The default values are configured to work with the included PostgreSQL container

### Redis Settings

These settings control Redis for caching and task queues:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `CELERY_BROKER_URL` | Redis URL for Celery broker | `redis://redis:6379/0` | No |
| `REDIS_LOCKER_URL` | Redis URL for Django cache/locks | `redis://redis:6379/3` | No |
| `CELERY_RESULT_BACKEND` | Celery results backend | `django-db` | No |

**Setup Steps:**
1. The default values work well with the bundled Redis service
2. Only change these if you're using an external Redis server

### JWT Settings

These settings control JSON Web Token authentication:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `ACCESS_TOKEN_LIFETIME_MINUTES` | JWT access token lifetime in minutes | `5` | No |
| `REFRESH_TOKEN_LIFETIME_DAYS` | JWT refresh token lifetime in days | `30` | No |

**Setup Steps:**
1. Adjust token lifetimes based on your security requirements
2. For more secure environments, consider shorter lifetimes

### MinIO Settings

These settings control MinIO object storage (S3-compatible):

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `MINIO_ENDPOINT` | MinIO endpoint for Django | `minio:9000` | No |
| `MINIO_EXTERNAL_ENDPOINT` | External MinIO endpoint | `localhost` | **Yes** for production |
| `MINIO_REGION` | MinIO region (optional) | `us-east-1` | No |
| `MINIO_ACCESS_KEY` | MinIO access key (username) | `minio` | **Yes** for production |
| `MINIO_SECRET_KEY` | MinIO secret key (password) | `minio123` | **Yes** for production |
| `MINIO_USE_HTTPS` | Use HTTPS for MinIO | `False` | No |
| `MINIO_EXTERNAL_ENDPOINT_USE_HTTPS` | Use HTTPS for external endpoint | `False` | No |
| `MINIO_URL_EXPIRY_HOURS` | MinIO URL expiry in hours | `7` | No |
| `MINIO_CONSISTENCY_CHECK_ON_START` | Check consistency on startup | `True` | No |
| `MINIO_PRIVATE_BUCKET` | Private bucket name | `private` | No |
| `MINIO_PUBLIC_BUCKET` | Public bucket name | `public` | No |
| `MINIO_BUCKET_CHECK_ON_SAVE` | Check bucket existence on save | `False` | No |
| `MINIO_BROWSER_REDIRECT_URL` | MinIO browser redirect URL | `http://localhost/minio-console/` | No |
| `MINIO_SERVER_URL` | MinIO server URL | `http://localhost/` | No |

**Setup Steps:**
1. For production, set strong credentials for `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`
2. **IMPORTANT**: When deploying to a domain other than localhost, you MUST change:
   - `MINIO_EXTERNAL_ENDPOINT` to your domain (e.g., `example.com`)
   - This variable controls how presigned URLs are generated for file downloads/uploads
3. If using HTTPS, set `MINIO_USE_HTTPS=True` and `MINIO_EXTERNAL_ENDPOINT_USE_HTTPS=True`
4. Update `MINIO_BROWSER_REDIRECT_URL` and `MINIO_SERVER_URL` to match your domain

### CORS Settings

These settings control Cross-Origin Resource Sharing:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF | Empty | No |
| `CORS_ALLOWED_ORIGINS` | Allowed origins for CORS | Empty | No |
| `CORS_ALLOWED_ORIGIN_REGEXES` | Regexes for CORS origins | Empty | No |
| `CORS_ALLOW_ALL_ORIGINS` | Allow all origins | `False` | No |

**Setup Steps:**
1. For production, add your domain to `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS`
2. Example: `CSRF_TRUSTED_ORIGINS=https://example.com,https://www.example.com`
3. Avoid setting `CORS_ALLOW_ALL_ORIGINS=True` in production

### Authentication Settings

These settings control user authentication:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `IS_ENTERPRISE_MODE_ACTIVE` | Enterprise mode | `False` | No |
| `IS_LOGIN_ACTIVE` | Enable login functionality | `True` | No |
| `IS_SIGNUP_ACTIVE` | Enable signup functionality | `False` | No |
| `IS_GITHUB_LOGIN_ACTIVE` | Enable GitHub login | `False` | No |
| `IS_GOOGLE_LOGIN_ACTIVE` | Enable Google login | `False` | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Empty | Required for GitHub login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Empty | Required for GitHub login |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Empty | Required for Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Empty | Required for Google login |

**Setup Steps:**
1. Note that signup is disabled by default (`IS_SIGNUP_ACTIVE=False`)
2. Social logins are disabled by default
3. For social login via GitHub:
   - Create an OAuth app at https://github.com/settings/developers
   - Set the callback URL to `http://your-domain.com/api/auth/github/callback/`
   - Add the client ID and secret to your env variables
4. For social login via Google:
   - Create credentials at https://console.developers.google.com/
   - Set the authorized redirect URI to `http://your-domain.com/api/auth/google/callback/`
   - Add the client ID and secret to your env variables

### Email Settings

These settings control email sending:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `EMAIL_BACKEND` | Email backend | Django SMTP Backend | No |
| `EMAIL_HOST` | SMTP host | Empty | Required for email |
| `EMAIL_PORT` | SMTP port | `587` | No |
| `EMAIL_USE_TLS` | Use TLS for SMTP | `True` | No |
| `EMAIL_HOST_USER` | SMTP username | Empty | Required for email |
| `EMAIL_HOST_PASSWORD` | SMTP password | Empty | Required for email |
| `DEFAULT_FROM_EMAIL` | Default from email | Empty | Required for email |

**Setup Steps:**
1. For production, set up a proper email service
2. For testing, you can use services like Mailhog or the built-in Postfix container
3. If using Gmail, you'll need to generate an App Password

### Scrapy Settings

These settings control web scraping with Scrapy:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `SCRAPY_USER_AGENT` | User agent for scraping | `WaterCrawl/0.6.0 (+https://github.com/watercrawl/watercrawl)` | No |
| `SCRAPY_ROBOTSTXT_OBEY` | Obey robots.txt rules | `True` | No |
| `SCRAPY_CONCURRENT_REQUESTS` | Concurrent requests | `16` | No |
| `SCRAPY_DOWNLOAD_DELAY` | Download delay (seconds) | `0` | No |
| `SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN` | Requests per domain | `4` | No |
| `SCRAPY_CONCURRENT_REQUESTS_PER_IP` | Requests per IP | `4` | No |
| `SCRAPY_COOKIES_ENABLED` | Enable cookies | `False` | No |
| `SCRAPY_HTTPCACHE_ENABLED` | Enable HTTP cache | `True` | No |
| `SCRAPY_HTTPCACHE_EXPIRATION_SECS` | HTTP cache expiration | `3600` | No |
| `SCRAPY_HTTPCACHE_DIR` | HTTP cache directory | `httpcache` | No |
| `SCRAPY_LOG_LEVEL` | Scrapy log level | `ERROR` | No |

**Setup Steps:**
1. Adjust these settings based on your scraping needs
2. For more aggressive scraping, increase concurrent requests (but be respectful)
3. For more polite scraping, add a download delay

### Playwright Settings

These settings control browser automation with Playwright:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `PLAYWRIGHT_SERVER` | Playwright server URL | `http://playwright:8000` | No |
| `PLAYWRIGHT_API_KEY` | Playwright API key | `your-secret-api-key` | **Yes** for production |
| `PORT` | Playwright service port | `8000` | No |
| `HOST` | Playwright service host | `0.0.0.0` | No |

**Setup Steps:**
1. For production, set a strong `PLAYWRIGHT_API_KEY`
2. This key will be used for authentication between services

### Integration Settings

These settings control third-party integrations:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `OPENAI_API_KEY` | OpenAI API key | Empty | Required for AI features |
| `STRIPE_SECRET_KEY` | Stripe secret key | Empty | Required for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Empty | Required for Stripe webhooks |
| `GOOGLE_ANALYTICS_ID` | Google Analytics ID | Empty | Optional |

**Setup Steps:**
1. For AI features, get an API key from OpenAI
2. For payment processing, set up a Stripe account
3. For Stripe webhooks, configure your webhook endpoint in Stripe dashboard

### Feature Flags

These settings control feature availability:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `MAX_CRAWL_DEPTH` | Maximum crawl depth | `-1` (unlimited) | No |
| `CAPTURE_USAGE_HISTORY` | Capture usage history | `True` | No |

**Setup Steps:**
1. For limiting crawl depth, set a positive integer
2. For disabling usage tracking, set `CAPTURE_USAGE_HISTORY=False`

### Frontend Settings

These settings control the React frontend:

| Variable | Description | Default | Required? |
|----------|-------------|---------|-----------|
| `API_BASE_URL` | API base URL for frontend | `/api` | No |

**Setup Steps:**
1. The default value `/api` works with the Nginx configuration
2. You can use an absolute URL (e.g., `http://localhost/api`) or a relative URL (e.g., `/api`)

## Deployment Steps

Follow these steps to deploy WaterCrawl:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/watercrawl/watercrawl.git
   cd watercrawl
   ```

2. **Create environment file**:
   ```bash
   cp docker/.env.example docker/.env
   ```

3. **Edit the environment file** to set required variables:
   ```bash
   # At minimum for production, set these:
   SECRET_KEY="your-generated-secret-key"
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com
   POSTGRES_PASSWORD=your-strong-password
   MINIO_ACCESS_KEY=your-minio-username
   MINIO_SECRET_KEY=your-minio-password
   MINIO_EXTERNAL_ENDPOINT=your-domain.com  # CRITICAL: Set to your domain
   PLAYWRIGHT_API_KEY=your-strong-api-key
   ```

4. **Start the services**:
   ```bash
   cd docker
   docker-compose up -d
   ```

5. **Initialize the database** (first run only):
   ```bash
   docker-compose exec app python manage.py migrate
   docker-compose exec app python manage.py createsuperuser
   ```

6. **Access the application**:
   - Frontend: http://your-domain.com
   - API: http://your-domain.com/api
   - MinIO Console: http://your-domain.com/minio-console

## Accessing Services

After deployment, you can access the following services:

- **Frontend**: The main web application
  - URL: http://your-domain.com/

- **API**: The Django REST API
  - URL: http://your-domain.com/api/
  - Documentation: http://your-domain.com/api/schema/swagger-ui/

- **MinIO Console**: The S3-compatible storage admin
  - URL: http://your-domain.com/minio-console/
  - Login with MINIO_ACCESS_KEY and MINIO_SECRET_KEY

## Troubleshooting

### Connection Issues

- **Cannot connect to a service**: Check Docker logs with `docker-compose logs <service-name>`
- **Database connection error**: Ensure PostgreSQL is running with `docker-compose ps`
- **Frontend not loading**: Check for JavaScript errors in browser console

### Data Persistence

- **Data lost after restart**: Ensure volumes are properly configured
- **Cannot upload files**: Check MinIO credentials and bucket configuration

### Performance Issues

- **Slow response times**: Check resource usage with `docker stats`
- **Memory issues**: Adjust JVM settings for MinIO or worker counts for Gunicorn

For more help, please open an issue on the GitHub repository.
