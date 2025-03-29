# Configuration Guide

## Environment Configuration

The application uses several environment files for configuration. Here's a detailed breakdown of each:

### app.env
Contains the main application configuration including:

#### Django Settings
- `SECRET_KEY`: Secret key for Django application
- `DEBUG`: Debug mode (True/False)
- `ALLOWED_HOSTS`: List of allowed hosts
- `LANGUAGE_CODE`: Default language code (e.g., en-us)
- `TIME_ZONE`: Server time zone (e.g., UTC)
- `USE_I18N`: Enable internationalization
- `USE_TZ`: Enable timezone support

#### Database Configuration
- `DATABASE_URL`: PostgreSQL connection URL

#### JWT Settings
- `ACCESS_TOKEN_LIFETIME_MINUTES`: Access token expiration time in minutes
- `REFRESH_TOKEN_LIFETIME_DAYS`: Refresh token expiration time in days

#### Celery Configuration
- `CELERY_BROKER_URL`: Redis URL for Celery
- `CELERY_RESULT_BACKEND`: Backend for storing results

#### Storage Configuration
- `STATICFILES_STORAGE`: Storage backend for static files
- `DEFAULT_FILE_STORAGE`: Storage backend for media files

#### MinIO Settings (Optional)
- `MINIO_ENDPOINT`: MinIO server endpoint
- `MINIO_EXTERNAL_ENDPOINT`: Public MinIO endpoint
- `MINIO_EXTERNAL_ENDPOINT_USE_HTTPS`: Use HTTPS for external endpoint
- `MINIO_REGION`: MinIO region
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key
- `MINIO_USE_HTTPS`: Use HTTPS for internal endpoint
- `MINIO_URL_EXPIRY_HOURS`: Signed URL expiration time
- `MINIO_PRIVATE_BUCKET`: Private bucket name
- `MINIO_PUBLIC_BUCKET`: Public bucket name

#### CORS Settings
- `CSRF_TRUSTED_ORIGINS`: List of trusted origins for CSRF
- `CORS_ALLOWED_ORIGINS`: List of allowed CORS origins
- `CORS_ALLOWED_ORIGIN_REGEXES`: Regex patterns for allowed origins
- `CORS_ALLOW_ALL_ORIGINS`: Allow all origins (not recommended for production)

#### Plugins Configuration
- `WATER_CRAWL_PLUGINS`: List of enabled plugins

#### OpenAI Settings (Optional)
- `OPENAI_API_KEY`: OpenAI API key for AI features

#### Scrapy Settings
- `SCRAPY_USER_AGENT`: Custom user agent string
- `SCRAPY_ROBOTSTXT_OBEY`: Respect robots.txt rules
- `SCRAPY_CONCURRENT_REQUESTS`: Maximum concurrent requests
- `SCRAPY_DOWNLOAD_DELAY`: Delay between requests
- `SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN`: Max requests per domain
- `SCRAPY_CONCURRENT_REQUESTS_PER_IP`: Max requests per IP
- `SCRAPY_COOKIES_ENABLED`: Enable cookie handling
- `SCRAPY_HTTPCACHE_ENABLED`: Enable HTTP caching
- `SCRAPY_HTTPCACHE_EXPIRATION_SECS`: Cache expiration time
- `SCRAPY_HTTPCACHE_DIR`: Cache directory
- `SCRAPY_LOG_LEVEL`: Logging level

#### Authentication Settings
- `IS_LOGIN_ACTIVE`: Enable/disable login
- `IS_SIGNUP_ACTIVE`: Enable/disable signup
- `IS_GITHUB_LOGIN_ACTIVE`: Enable GitHub OAuth
- `IS_GOOGLE_LOGIN_ACTIVE`: Enable Google OAuth

#### OAuth Settings (Optional)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret

#### Email Settings (Optional)
- `EMAIL_BACKEND`: Email backend configuration
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USE_TLS`: Use TLS for email
- `EMAIL_HOST_USER`: SMTP username
- `EMAIL_HOST_PASSWORD`: SMTP password
- `DEFAULT_FROM_EMAIL`: Default sender email

### db.env

PostgreSQL database configuration:
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name

for more information. check official documentation [https://hub.docker.com/_/postgres](https://hub.docker.com/_/postgres)

### minio.env
<!-- MINIO_BROWSER_REDIRECT_URL=http://localhost:9001
MINIO_SERVER_URL=http://localhost:9000
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
 -->

MinIO configuration:
- `MINIO_BROWSER_REDIRECT_URL`: MinIO browser redirect URL
- `MINIO_SERVER_URL`: MinIO server URL
- `MINIO_ROOT_USER`: MinIO root user
- `MINIO_ROOT_PASSWORD`: MinIO root password

for more information. check official documentation [https://hub.docker.com/r/minio/minio](https://hub.docker.com/r/minio/minio)

## Example Configurations

### app.env
   
```env
# Django settings
SECRET_KEY=django-insecure-example-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=*
LANGUAGE_CODE=en-us
TIME_ZONE=UTC
USE_I18N=True
USE_TZ=True

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres

# JWT settings
ACCESS_TOKEN_LIFETIME_MINUTES=5
REFRESH_TOKEN_LIFETIME_DAYS=30

# Celery settings
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=django-db

# Enterprise mode
IS_ENTERPRISE_MODE_ACTIVE=False

# Storage settings
STATICFILES_STORAGE=django.contrib.staticfiles.storage.StaticFilesStorage
DEFAULT_FILE_STORAGE=django.core.files.storage.FileSystemStorage

# MinIO settings (optional)
# MINIO_ENDPOINT=minio:9000
# MINIO_EXTERNAL_ENDPOINT=localhost:9000
# MINIO_EXTERNAL_ENDPOINT_USE_HTTPS=False
# MINIO_REGION=us-east-1
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin
# MINIO_USE_HTTPS=False
# MINIO_URL_EXPIRY_HOURS=7
# MINIO_PRIVATE_BUCKET=private
# MINIO_PUBLIC_BUCKET=public

# CORS settings
CSRF_TRUSTED_ORIGINS=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:8000
CORS_ALLOW_ALL_ORIGINS=True

# Plugins (optional)
# WATER_CRAWL_PLUGINS=watercrawl_openai.OpenAIPlugin

# OpenAI settings (optional)
# OPENAI_API_KEY=your-openai-api-key

# Scrapy settings
SCRAPY_USER_AGENT="WaterCrawl/0.1 (+https://github.com/watercrawl/watercrawl)"
SCRAPY_ROBOTSTXT_OBEY=True
SCRAPY_CONCURRENT_REQUESTS=32
SCRAPY_DOWNLOAD_DELAY=0
SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN=16
SCRAPY_CONCURRENT_REQUESTS_PER_IP=16
SCRAPY_COOKIES_ENABLED=False
SCRAPY_HTTPCACHE_ENABLED=True
SCRAPY_HTTPCACHE_EXPIRATION_SECS=3600
SCRAPY_HTTPCACHE_DIR=httpcache
SCRAPY_LOG_LEVEL=ERROR

# Authentication settings
IS_LOGIN_ACTIVE=True
IS_SIGNUP_ACTIVE=True
IS_GITHUB_LOGIN_ACTIVE=False
IS_GOOGLE_LOGIN_ACTIVE=False

# OAuth settings (optional)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret

# Email settings (optional)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-specific-password
# DEFAULT_FROM_EMAIL=your-email@gmail.com

```


### db.env

```env
# Database settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=watercrawl
```

### minio.env

```env
# MinIO settings
MINIO_BROWSER_REDIRECT_URL=http://localhost:9001
MINIO_SERVER_URL=http://localhost:9000
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
```



## Configuration Tips

1. **Security**
   - Always change default passwords in production
   - Use strong, unique passwords
   - Enable HTTPS in production
   - Restrict CORS origins

2. **Performance**
   - Adjust Celery worker settings based on load
   - Configure proper database connection pools
   - Set appropriate cache settings

3. **Storage**
   - Configure backup policies for MinIO
   - Set appropriate storage quotas
   - Monitor storage usage
