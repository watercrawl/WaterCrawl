# WaterCrawl Development Setup Guide

This guide will help you set up the WaterCrawl project for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.13** - [Download](https://www.python.org/downloads/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Poetry** - Install via: `curl -sSL https://install.python-poetry.org | python3 -`
- **pnpm** - Enable via: `corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** - [Download](https://www.docker.com/get-docker)

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-dev.sh
```

## Manual Setup

### 1. Clone and Navigate

```bash
git clone https://github.com/watercrawl/WaterCrawl.git
cd WaterCrawl
```

### 2. Set Up Docker Services

Start the required services (PostgreSQL, Redis, MinIO, Mailpit, Playwright, MCP):

```bash
cd docker
cp .env.example .env.local  # If not already done
docker-compose -f docker-compose.local.yml up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)
- Mailpit on ports 1025 (SMTP) and 8025 (UI)
- Playwright on port 8800
- MCP Server on port 8801

### 3. Set Up Backend

```bash
cd backend

# Create environment file
cp .env.example .env

# Configure Poetry to use Python 3.13
poetry env use python3.13

# Install dependencies
poetry install

# Install pre-commit hooks
poetry run pre-commit install

# Run database migrations
poetry run python manage.py migrate
```

### 4. Set Up Frontend

```bash
cd frontend

# Create environment file
cp .env.example .env

# Install dependencies
pnpm install
```

## Running the Development Servers

### Backend

In one terminal:

```bash
cd backend
poetry run python manage.py runserver
```

The backend API will be available at: http://localhost:8000

### Celery Worker

In another terminal (required for background tasks):

```bash
cd backend
poetry run celery -A watercrawl worker -B -l info
```

### Frontend

In another terminal:

```bash
cd frontend
pnpm run dev
```

The frontend will be available at: http://localhost:5173

## Access Points

Once everything is running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **API Documentation (Swagger)**: http://localhost:8000/api/schema/swagger-ui/
- **API Documentation (ReDoc)**: http://localhost:8000/api/schema/redoc/
- **MinIO Console**: http://localhost:9001 (username: `minio`, password: `minio123`)
- **Mailpit (Email Testing)**: http://localhost:8025

## Environment Variables

### Backend (.env)

Key variables to configure:

- `DATABASE_URL`: PostgreSQL connection string (default: `postgres://postgres:postgres@localhost:5432/postgres`)
- `REDIS_URL`: Redis connection string (default: `redis://localhost:6379/1`)
- `CELERY_BROKER_URL`: Celery broker URL (default: `redis://localhost:6379/0`)
- `MINIO_ENDPOINT`: MinIO endpoint (default: `localhost:9000`)
- `MINIO_ACCESS_KEY`: MinIO access key (default: `minio`)
- `MINIO_SECRET_KEY`: MinIO secret key (default: `minio123`)
- `PLAYWRIGHT_SERVER`: Playwright server URL (default: `http://localhost:8800`)
- `PLAYWRIGHT_API_KEY`: Playwright API key (default: `your-secret-api-key`)

### Frontend (.env)

Key variables to configure:

- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8000`)

## Code Quality

### Linting

**Backend (Ruff):**
```bash
cd backend
poetry run ruff check .
poetry run ruff format .
```

**Frontend (ESLint):**
```bash
cd frontend
pnpm run lint
pnpm run lint:fix
```

### Pre-commit Hooks

Pre-commit hooks are automatically installed. They run Ruff linter and formatter on Python files before each commit.

To run manually:
```bash
cd backend
poetry run pre-commit run --all-files
```

## Troubleshooting

### Python Version Issues

If you encounter Python version issues, ensure Poetry is using Python 3.13:

```bash
cd backend
poetry env use python3.13
poetry install
```

### Database Connection Issues

Ensure Docker services are running:

```bash
cd docker
docker-compose -f docker-compose.local.yml ps
```

If services are not running, start them:

```bash
docker-compose -f docker-compose.local.yml up -d
```

### Port Conflicts

If you encounter port conflicts, you can change the ports in:
- `docker/.env.local` for Docker services
- `backend/.env` for backend configuration
- `frontend/.env` for frontend configuration

### MinIO Access Issues

Default MinIO credentials:
- Access Key: `minio`
- Secret Key: `minio123`
- Console URL: http://localhost:9001

## Additional Resources

- [Contributing Guide](./CONTRIBUTING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](http://localhost:8000/api/schema/swagger-ui/) (when backend is running)

## Need Help?

If you encounter any issues during setup, please:
1. Check the [Contributing Guide](./CONTRIBUTING.md)
2. Review the error messages carefully
3. Ensure all prerequisites are installed correctly
4. Check that Docker services are running
5. Verify environment variables are set correctly

