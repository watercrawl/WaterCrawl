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
- OpenSearch for search and analytics
- OpenSearch Dashboards for visualizing OpenSearch data (optional)

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

### OpenSearch
Provides a distributed, RESTful search and analytics engine. Used for full-text search, log analytics, and more.

### OpenSearch Dashboards
Provides a web UI for OpenSearch, similar to Kibana for Elasticsearch.

## Usage

```bash
# Start all services
docker compose up

# Start only specific services
# (including opensearch and dashboards)
docker compose up nginx app frontend db redis opensearch dashboards

# Build and start services
docker compose up --build
```

## OpenSearch Access

- **OpenSearch API:** https://localhost:9200 (or http://localhost:9200 if not using HTTPS)
- **OpenSearch Dashboards:** http://localhost:5601
- **Default admin user:** `admin`
- **Default admin password:** `Amir123Amir`

> **Note:** The OpenSearch container uses self-signed certificates by default. You may need to accept security warnings in your browser or configure your client to ignore certificate verification for development.

## Data Persistence

All data for Postgres, MinIO, Redis, and OpenSearch is stored in the `./volumes/` directory. This ensures your data is not lost when containers are stopped or recreated.

## Troubleshooting

- If OpenSearch fails to start due to memory issues, ensure your Docker engine has at least 4GB of RAM allocated.
- If you need to reset OpenSearch data, stop all containers and delete the `./volumes/opensearch-data` directory.

---

For more information, see the [OpenSearch documentation](https://opensearch.org/docs/latest/).
