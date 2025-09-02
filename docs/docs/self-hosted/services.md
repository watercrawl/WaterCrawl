# Services Documentation

WaterCrawl consists of several services working together in a Docker Compose environment. Here's a detailed overview of each service:

## Core Services

### App (Django Application)
- **Image**: `watercrawl/watercrawl:v0.10.2`
- **Purpose**: Main application server
- **Tech Stack**: Django with Gunicorn
- **Default Port**: 9000 (internal)
- **Dependencies**: PostgreSQL, Redis
- **Key Features**:
  - REST API endpoints
  - User authentication
  - Crawl job management
  - Plugin system
  - Data processing
- **Command**: `gunicorn -b 0.0.0.0:9000 -w 2 watercrawl.wsgi:application --access-logfile - --error-logfile - --timeout 60`

### Frontend
- **Image**: `watercrawl/frontend:v0.10.2`
- **Purpose**: Web interface
- **Tech Stack**: React/Vite
- **Dependencies**: App (Core API)
- **Key Features**:
  - User interface
  - Interactive dashboard
  - Job management interface
- **Environment Variables**:
  - `VITE_API_BASE_URL`: API endpoint URL
- **Command**: `npm run serve`

### Nginx
- **Image**: `nginx:alpine`
- **Purpose**: Web server and reverse proxy
- **Default Port**: 80 (configurable via `NGINX_PORT`)
- **Dependencies**: App, Frontend, MinIO
- **Volumes**:
  - `./nginx/nginx.conf:/etc/nginx/conf.d/default.conf.template`
  - `./nginx/entrypoint.sh:/entrypoint.sh`
- **Command**: Runs an entrypoint script that configures and starts Nginx

### Celery (Task Queue)
- **Image**: Same as App (`watercrawl/watercrawl:v0.10.2`)
- **Purpose**: Background task processing
- **Dependencies**: Redis, App
- **Key Features**:
  - Asynchronous task execution
  - Crawl job scheduling
  - Data processing tasks
  - Plugin execution
- **Command**: `celery -A watercrawl worker -l info -S django`

### Celery Beat (Scheduler)
- **Image**: Same as App (`watercrawl/watercrawl:v0.10.2`)
- **Purpose**: Periodic task scheduler
- **Dependencies**: Redis, App, Celery
- **Key Features**:
  - Schedule periodic tasks
  - Run recurring jobs
- **Command**: `celery -A watercrawl beat -l info -S django`

## Supporting Services

### PostgreSQL
- **Image**: `postgres:17.2-alpine3.21`
- **Purpose**: Main database
- **Default Port**: 5432 (internal)
- **Volumes**: `./volumes/postgres-db:/var/lib/postgresql/data`
- **Environment Variables**:
  - `POSTGRES_PASSWORD`: Database password
  - `POSTGRES_USER`: Database username
  - `POSTGRES_DB`: Database name
- **Health Check**: Ensures database is ready before dependent services start

### Redis
- **Image**: `redis:latest`
- **Purpose**: Cache and message broker
- **Used For**:
  - Celery task queue
  - Django cache
  - Rate limiting
  - Locks

### MinIO
- **Image**: `minio/minio:RELEASE.2024-11-07T00-52-20Z`
- **Purpose**: Object storage (S3-compatible)
- **Volumes**: `./volumes/minio-data:/data`
- **Environment Variables**:
  - `MINIO_BROWSER_REDIRECT_URL`: URL for MinIO console
  - `MINIO_SERVER_URL`: URL for MinIO server
  - `MINIO_ROOT_USER`: MinIO username (same as `MINIO_ACCESS_KEY`)
  - `MINIO_ROOT_PASSWORD`: MinIO password (same as `MINIO_SECRET_KEY`)
- **Command**: `server /data --console-address ":9001"`

### Playwright
- **Image**: `watercrawl/playwright:1.1`
- **Purpose**: Headless browser for JavaScript rendering
- **Default Port**: 8000 (internal)
- **Environment Variables**:
  - `AUTH_API_KEY`: API key for authentication
  - `PORT`: Service port
  - `HOST`: Service host

## Service Interaction

The services interact as follows:

1. **User Flow**:
   - Users access the application through Nginx (port 80)
   - Nginx routes requests to Frontend or App based on the URL path
   - API requests are sent to the App
   - Static assets are served by Frontend

2. **Crawl Job Flow**:
   - App receives crawl/search requests from users
   - App enqueues jobs to Celery via Redis
   - Celery processes jobs using Scrapy or Playwright as needed
   - Results are stored in PostgreSQL and file assets in MinIO
   - Users can monitor job status through the Frontend

3. **Storage Flow**:
   - Media files are stored in MinIO
   - MinIO provides S3-compatible API for file operations
   - Nginx proxies MinIO requests for simplified access

## Scaling Considerations

When scaling the application, consider:

1. **Celery Workers**: Add more workers for increased crawl job throughput
2. **PostgreSQL**: Consider using a managed database service for production
3. **Redis**: May need to scale for high-volume queues
4. **Storage**: MinIO can be configured for cluster mode or replaced with S3

## Monitoring

Monitor your services using:

```bash
# Check service status
docker compose ps

# View logs for all services
docker compose logs

# View logs for a specific service
docker compose logs app

# Follow logs in real-time
docker compose logs -f

# View resource usage
docker stats