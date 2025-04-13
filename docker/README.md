# WaterCrawl Docker Configuration

This directory contains the Docker configuration for the WaterCrawl project, which includes:

- Nginx reverse proxy for all services
- Backend (Django) service
- Frontend (React/TypeScript/Vite) service
- MinIO object storage
- Postgres database
- Redis for caching and Celery
- Mailpit for email testing
- Playwright for web scraping

## Environment Variables

All environment variables are defined directly in the `docker-compose.yml` file with sensible defaults. This approach:

1. Makes the configuration more explicit and self-documenting
2. Removes the need for multiple .env files
3. Makes it easier to track all configuration in version control

The default values in `docker-compose.yml` can be overridden by:

1. Setting environment variables in your shell before running docker-compose
2. Creating a `.env` file in this directory (use `.env.example` as a template)

## Services

### Nginx
Acts as a reverse proxy for all services, providing a unified entry point:
- Frontend: http://localhost/
- API: http://localhost/api/
- MinIO API: http://localhost/minio/
- MinIO Console: http://localhost/minio-console/

### Backend (app and celery)
Runs the Django application and Celery worker for background tasks.

### Frontend
Serves the React/TypeScript application.

### MinIO
Provides S3-compatible object storage.

### Database
PostgreSQL database for the application.

### Redis
Used for caching and as a message broker for Celery.

## Usage

```bash
# Start all services
docker compose up

# Start only specific services
docker compose up nginx app frontend db redis

# Build and start services
docker compose up --build
```
