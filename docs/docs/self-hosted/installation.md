# Installation Guide

## Installation Steps

1. **System Requirements Check**
   Ensure your system meets the minimum requirements:
   - Docker Engine 24.0.0+
   - Docker Compose v2.0.0+
   - At least 2GB of RAM
   - 10GB of free disk space

2. **Clone the Repository**
   ```bash
   git clone https://github.com/watercrawl/watercrawl.git
   cd watercrawl
   ```

3. **Set Up Environment Configuration**
   ```bash
   cd docker
   cp .env.example .env
   ```
   
   Edit the `.env` file to customize your installation. At minimum, you should update:
   - `SECRET_KEY` (for security)
   - `API_ENCRYPTION_KEY` (for security)
   - `FRONTEND_URL` (if deploying on a domain other than localhost)
   - `MINIO_EXTERNAL_ENDPOINT`, `MINIO_BROWSER_REDIRECT_URL`, and `MINIO_SERVER_URL` (if deploying on a domain other than localhost)

4. **Start Services**
   ```bash
   docker compose up -d
   ```

5. **Create Admin User**
   ```bash
   docker compose exec app python manage.py createsuperuser
   ```

6. **Verify Installation**
   - Access the web interface at `http://localhost` (or your configured domain)
   - Log in with your admin credentials
   - Check the status of all services using `docker compose ps`
   - Monitor logs using `docker compose logs -f`

## Important Deployment Notes

When deploying to a production environment with a domain other than localhost, you **MUST** update the following settings in your `.env` file:

```bash
# Change this from 'localhost' to your actual domain or IP
MINIO_EXTERNAL_ENDPOINT=your-domain.com

# Also update these URLs accordingly
MINIO_BROWSER_REDIRECT_URL=http://your-domain.com/minio-console/
MINIO_SERVER_URL=http://your-domain.com/
```

Failure to update these settings will result in broken file uploads and downloads.

## Directory Structure

After installation, your directory structure will look like:

```
watercrawl/
├── docker/
│   ├── .env                  # Your environment configuration file
│   ├── docker-compose.yml    # Docker Compose configuration
│   ├── nginx/                # Nginx configuration files
│   │   ├── nginx.conf        # Nginx configuration template
│   │   └── entrypoint.sh     # Nginx entrypoint script
│   └── volumes/              # Persistent data volumes
│       ├── minio-data/       # MinIO storage
│       └── postgres-db/      # PostgreSQL database
```

## Upgrading

To upgrade your WaterCrawl installation to the latest version:

1. **Update Repository**
   ```bash
   git pull origin main
   ```

2. **Update Environment Variables**
   Check for any new environment variables in `.env.example` and add them to your `.env` file.

3. **Rebuild and Restart Services**
   ```bash
   docker compose down
   docker compose up -d
   ```

4. **Apply Database Migrations**
   ```bash
   The database changes are automatically applied when the app container is started.
   ```
