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
   git clone https://github.com/watercrawl/self-hosted.git
   cd self-hosted
   ```

3. **Run Installation Script**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

4. **Start Services**
   ```bash
   docker compose up -d
   ```

5. **Create Admin User**
   ```bash
   chmod +x create_admin.sh
   ./create_admin.sh
   ```

6. **Verify Installation**
   - Access the web interface at `http://YourWebsiteDomain.xyz`
   - Log in with your admin credentials
   - Check the status of all services using `docker compose ps`
   - Monitor logs using `docker compose logs -f`



## Installation Options

The installation script (`install.sh`) supports the following options:

- `--reinstall`: Backs up existing environment files and performs a fresh installation
- Interactive prompts for:
  - Website Domain
  - Storage Domain
  - Website Protocol (http/https)
  - Storage Protocol (http/https)

## Directory Structure

```
self_hosted/
├── app.env                 # Application environment variables
├── db.env                  # Database environment variables
├── frontend.env            # Frontend environment variables (Website URL)
├── minio.env (optional)    # MinIO environment variables
├── create_admin.sh         # Script to create admin user
├── docker-compose.yml      # Docker Compose configuration
├── install.sh              # Installation script
├── env_templates           # Environment template files
    ├── app.env.example
    ├── db.env.example
    ├── frontend.env.example
    └── minio.env.example
└── frontend/              # Frontend configuration files
    └── Dockerfile         # Frontend Dockerfile
└── nginx/                 # Nginx configuration files
    └── default.conf
└── watercrawl/            # Application coffiguration files
    ├── Dockerfile         # Application Dockerfile
    └── plugin_requirements.txt  # Plugin dependencies
```

## Backup and Restore

Environment files are automatically backed up when using the `--reinstall` option. Backups are stored in:
```
.config_backups/{date}/
```
