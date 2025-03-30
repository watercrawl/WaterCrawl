# Services Documentation

WaterCrawl consists of several microservices working together. Here's a detailed overview of each service:

## Core Services

### Core (Django Application)
- **Purpose**: Main application server
- **Tech Stack**: Django with Gunicorn
- **Default Port**: 9000
- **Dependencies**: PostgreSQL, Redis
- **Key Features**:
  - REST API endpoints
  - User authentication
  - Crawl job management
  - Plugin system
  - Data processing
- **Configuration**: Uses `app.env`
- **Storage**: Mounts `/var/www/storage` (If you setup without MinIO it will be requied)

### Frontend
- **Purpose**: Web interface
- **Tech Stack**: React
- **Configuration**: Uses `frontend.env`
- **Dependencies**: Core API
- **Key Features**:
  - User interface
  - Interactive dashboard
  - Job management interface

### Nginx
- **Purpose**: Web server and reverse proxy
- **Tech Stack**: Nginx Alpine 1.25
- **Default Port**: 80
- **Dependencies**: Frontend, Core
- **Volumes**:
  - Configuration: `./nginx:/etc/nginx/conf.d:ro`
  - Storage: `/var/www/storage`

### Celery (Task Queue)
- **Purpose**: Background task processing
- **Tech Stack**: Celery
- **Dependencies**: Redis
- **Configuration**: Uses `app.env`
- **State Directory**: `.celery/worker.state`
- **Key Features**:
  - Asynchronous task execution
  - Crawl job scheduling
  - Data processing tasks
  - Plugin execution
  - Periodic tasks (beat)

## Database Services

### PostgreSQL
- **Purpose**: Primary database
- **Version**: 17.2 Alpine
- **Default Port**: 5432
- **Configuration**: Uses `db.env`
- **Data Location**: `/var/lib/postgresql/data`
- **Health Check**: 
  - Command: `pg_isready -U postgres`
  - Interval: 5s
- **Key Features**:
  - User data storage
  - Crawl job metadata
  - Plugin configurations
  - System settings

### Redis
- **Purpose**: Message broker and caching
- **Version**: Latest
- **Default Port**: 6379
- **Key Features**:
  - Celery message broker
  - Cache storage
  - Real-time updates
  - Session management

## Optional Services

### MinIO (Optional)
- **Purpose**: Object storage
- **Version**: RELEASE.2024-11-07T00-52-20Z
- **Default Ports**: 
  - API: 9000
  - Console: 9001
- **Configuration**: Uses `minio.env`
- **Data Location**: `/data`
- **Health Check**:
  - Command: `curl -f http://localhost:9001/minio/health/live`
  - Interval: 30s
- **Key Features**:
  - File storage
  - Media storage
  - Crawl data storage
  - Plugin storage

## Volumes

The following persistent volumes are used:
- `postgres-db`: PostgreSQL data
- `storage_volume`: Shared storage for app and nginx
- `redis-data`: Redis data
- `minio-data`: MinIO data (optional)

## Service Management

### Starting Services
```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d [service_name]
```

### Stopping Services
```bash
# Stop all services
docker compose down

# Stop specific service
docker compose stop [service_name]
```

### Viewing Logs
```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs [service_name]

# Follow logs
docker compose logs -f [service_name]
```

### Service Health Checks
```bash
# Check service status
docker compose ps

# Check service health
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
```

## Scaling Services

### Horizontal Scaling

Celery workers can be scaled as needed:
```bash
# Scale celery workers
docker compose up -d --scale celery=3