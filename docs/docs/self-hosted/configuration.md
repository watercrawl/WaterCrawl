# Configuration Guide

## Environment Configuration

WaterCrawl uses a single `.env` file in the `docker` directory for all configuration settings. This file contains all the necessary environment variables for the application, database, frontend, and other services.

> **⚠️ Security Warning:** For security in production environments, always change default values for passwords, secrets, and API keys. Using default values creates significant security vulnerabilities.

### Core Settings

#### General Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `VERSION` | `v0.12.2`     | Application version. Always check [GitHub Releases](https://github.com/watercrawl/WaterCrawl/releases) for the latest version |
| `NGINX_PORT` | `80`          | Port for the Nginx service |

#### Django Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `SECRET_KEY` | `django-insecure-el4wo4a4--=f0+ag#omp@^w4eq^8v4(scda&1a(td_y2@=sh6&` | **Secret key for Django application. Generate a new one using `openssl rand -base64 32`. MUST be changed in production!** |
| `API_ENCRYPTION_KEY` | `8zSd6JIuC7ovfZ4AoxG_XmhubW6CPnQWW7Qe_4TD1TQ=` | **API encryption key for security. Generate a new one using `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. MUST be changed in production!** |
| `DEBUG` | `True` | Debug mode (set to `False` in production) |
| `ALLOWED_HOSTS` | `*` | List of allowed hosts (comma-separated) |
| `LANGUAGE_CODE` | `en` | Default language code |
| `TIME_ZONE` | `UTC` | Server time zone |
| `USE_I18N` | `True` | Enable internationalization |
| `USE_TZ` | `True` | Enable timezone support |
| `STATIC_ROOT` | `storage/static/` | Static files directory |
| `MEDIA_ROOT` | `storage/media/` | Media files directory |
| `LOG_LEVEL` | `INFO` | Application log level (DEBUG, INFO, WARNING, ERROR, CRITICAL) |
| `FRONTEND_URL` | `http://localhost` | URL for the frontend application (used for CORS and redirects) |

### Database Configuration

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `POSTGRES_HOST` | `db` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_PASSWORD` | `postgres` | **PostgreSQL password. MUST be changed in production!** |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_DB` | `postgres` | PostgreSQL database name |

### Redis and Celery Configuration

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `REDIS_URL` | `redis://redis:6379/1` | Redis URL for Django cache |
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Redis URL for Celery broker |
| `CELERY_RESULT_BACKEND` | `django-db` | Backend for storing Celery results |
| `REDIS_LOCKER_URL` | `redis://redis:6379/3` | Redis URL for Django locks |

### MinIO Configuration

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `MINIO_ENDPOINT` | `minio:9000` | MinIO server internal endpoint |
| `MINIO_EXTERNAL_ENDPOINT` | `localhost` | Public MinIO endpoint (domain or IP, no port) |
| `MINIO_REGION` | `us-east-1` | MinIO region (optional) |
| `MINIO_ACCESS_KEY` | `minio` | **MinIO access key (username). MUST be changed in production!** |
| `MINIO_SECRET_KEY` | `minio123` | **MinIO secret key (password). MUST be changed in production!** |
| `MINIO_USE_HTTPS` | `False` | Use HTTPS for internal endpoint |
| `MINIO_EXTERNAL_ENDPOINT_USE_HTTPS` | `False` | Use HTTPS for external endpoint |
| `MINIO_URL_EXPIRY_HOURS` | `7` | Signed URL expiration time in hours |
| `MINIO_CONSISTENCY_CHECK_ON_START` | `True` | Check bucket consistency on startup |
| `MINIO_PRIVATE_BUCKET` | `private` | Private bucket name |
| `MINIO_PUBLIC_BUCKET` | `public` | Public bucket name |
| `MINIO_BUCKET_CHECK_ON_SAVE` | `False` | Check bucket existence on save |
| `MINIO_BROWSER_REDIRECT_URL` | `http://localhost/minio-console/` | URL for MinIO browser console redirects |
| `MINIO_SERVER_URL` | `http://localhost/` | MinIO server URL for browser redirects |

### CORS Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `CSRF_TRUSTED_ORIGINS` | `` | List of trusted origins for CSRF protection |
| `CORS_ALLOWED_ORIGINS` | `` | List of allowed CORS origins |
| `CORS_ALLOWED_ORIGIN_REGEXES` | `` | Regex patterns for allowed origins |
| `CORS_ALLOW_ALL_ORIGINS` | `False` | Allow all origins (not recommended for production) |

### Authentication Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `IS_ENTERPRISE_MODE_ACTIVE` | `False` | Enable enterprise mode features |
| `IS_LOGIN_ACTIVE` | `True` | Enable login functionality |
| `IS_SIGNUP_ACTIVE` | `False` | Enable signup functionality |
| `IS_EMAIL_VERIFICATION_ACTIVE` | `True` | Enable email verification |
| `IS_GITHUB_LOGIN_ACTIVE` | `False` | Enable GitHub OAuth login |
| `IS_GOOGLE_LOGIN_ACTIVE` | `False` | Enable Google OAuth login |
| `GITHUB_CLIENT_ID` | `` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `` | GitHub OAuth client secret |
| `GOOGLE_CLIENT_ID` | `` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `` | Google OAuth client secret |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | `5` | JWT access token lifetime in minutes |
| `REFRESH_TOKEN_LIFETIME_DAYS` | `30` | JWT refresh token lifetime in days |

### Email Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | Django email backend |
| `EMAIL_HOST` | `` | SMTP server host |
| `EMAIL_PORT` | `587` | SMTP server port |
| `EMAIL_USE_TLS` | `True` | Use TLS for SMTP |
| `EMAIL_HOST_USER` | `` | SMTP username |
| `EMAIL_HOST_PASSWORD` | `` | **SMTP password. MUST be changed if using email functionality!** |
| `DEFAULT_FROM_EMAIL` | `` | Default sender email address |

### Scrapy Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `SCRAPY_USER_AGENT` | `WaterCrawl/0.5.0 (+https://github.com/watercrawl/watercrawl)` | User agent for web scraping |
| `SCRAPY_ROBOTSTXT_OBEY` | `True` | Obey robots.txt rules |
| `SCRAPY_CONCURRENT_REQUESTS` | `16` | Maximum concurrent requests |
| `SCRAPY_DOWNLOAD_DELAY` | `0` | Delay between requests in seconds |
| `SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN` | `4` | Maximum concurrent requests per domain |
| `SCRAPY_CONCURRENT_REQUESTS_PER_IP` | `4` | Maximum concurrent requests per IP |
| `SCRAPY_COOKIES_ENABLED` | `False` | Enable cookies |
| `SCRAPY_HTTPCACHE_ENABLED` | `True` | Enable HTTP cache |
| `SCRAPY_HTTPCACHE_EXPIRATION_SECS` | `3600` | HTTP cache expiration time in seconds |
| `SCRAPY_HTTPCACHE_DIR` | `httpcache` | HTTP cache directory |
| `SCRAPY_LOG_LEVEL` | `ERROR` | Scrapy log level |
| `SCRAPY_GOOGLE_API_KEY` | `` | Google API key (for search integration) |
| `SCRAPY_GOOGLE_CSE_ID` | `` | Google Custom Search Engine ID |

### Playwright Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `PLAYWRIGHT_SERVER` | `http://playwright:8000` | Playwright service URL |
| `PLAYWRIGHT_API_KEY` | `your-secret-api-key` | **Playwright API key for authentication. MUST be changed in production!** |
| `PLAYWRIGHT_PORT` | `8000` | Playwright service port |
| `PLAYWRIGHT_HOST` | `0.0.0.0` | Playwright service host |

### Integration Settings

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `OPENAI_API_KEY` | `` | OpenAI API key |
| `STRIPE_SECRET_KEY` | `` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `` | Stripe webhook secret |
| `GOOGLE_ANALYTICS_ID` | `` | Google Analytics tracking ID |

### Feature Flags

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `MAX_CRAWL_DEPTH` | `-1` | Maximum crawl depth (-1 for unlimited) |
| `CAPTURE_USAGE_HISTORY` | `True` | Capture user usage history |

## Example Configuration

Below is a basic configuration example for the `.env` file:

```bash
# Core Settings
VERSION=v0.12.2  # Check https://github.com/watercrawl/WaterCrawl/releases for latest version
NGINX_PORT=80
SECRET_KEY=your_secure_secret_key_here  # Generate with: openssl rand -base64 32
API_ENCRYPTION_KEY=your_secure_api_encryption_key_here  # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
DEBUG=False
ALLOWED_HOSTS=example.com,www.example.com
FRONTEND_URL=https://example.com

# Database Settings
POSTGRES_PASSWORD=secure_database_password  # Use a strong password!

# MinIO Settings (Important for production)
MINIO_EXTERNAL_ENDPOINT=example.com
MINIO_BROWSER_REDIRECT_URL=https://example.com/minio-console/
MINIO_SERVER_URL=https://example.com/
MINIO_ACCESS_KEY=secure_access_key  # Use a strong username
MINIO_SECRET_KEY=secure_secret_key  # Use a strong password!

# Email Settings (for user notifications)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=notifications@example.com
EMAIL_HOST_PASSWORD=secure_email_password  # Use a strong password or app-specific password
DEFAULT_FROM_EMAIL=notifications@example.com
```

> **⚠️ Security Warning:** Never commit your `.env` file to version control or share it publicly. It contains sensitive information that should be kept private.
