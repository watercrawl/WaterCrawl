#!/bin/bash

# WaterCrawl Development Setup Script
# This script helps set up the development environment

set -e

# Colors for output
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${COLOR_BLUE}🚀 WaterCrawl Development Setup${COLOR_RESET}"
echo ""

# Check prerequisites
echo -e "${COLOR_BLUE}Checking prerequisites...${COLOR_RESET}"

# Check Python 3.13
if command -v python3.13 &> /dev/null; then
    PYTHON_VERSION=$(python3.13 --version)
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $PYTHON_VERSION"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Python 3.13 not found. Please install Python 3.13."
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} Node.js $NODE_VERSION"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Node.js not found. Please install Node.js 20+."
    exit 1
fi

# Check Poetry
if command -v poetry &> /dev/null; then
    POETRY_VERSION=$(poetry --version)
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $POETRY_VERSION"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Poetry not found. Installing..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} pnpm $PNPM_VERSION"
else
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} pnpm not found. Installing..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $DOCKER_VERSION"
else
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} Docker not found. Docker is required for local development services."
fi

echo ""

# Setup backend
echo -e "${COLOR_BLUE}Setting up backend...${COLOR_RESET}"
cd "$PROJECT_ROOT/backend"

# Create .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${COLOR_GREEN}✓${COLOR_RESET} Created .env from .env.example"
    else
        echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} .env.example not found. You may need to create .env manually."
    fi
else
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} .env file already exists"
fi

# Setup Poetry environment
echo -e "${COLOR_BLUE}Configuring Poetry environment...${COLOR_RESET}"
poetry env use python3.13

# Install dependencies
echo -e "${COLOR_BLUE}Installing backend dependencies...${COLOR_RESET}"
poetry install --no-interaction

# Install pre-commit hooks
echo -e "${COLOR_BLUE}Installing pre-commit hooks...${COLOR_RESET}"
poetry run pre-commit install

echo -e "${COLOR_GREEN}✓${COLOR_RESET} Backend setup complete!"
echo ""

# Setup frontend
echo -e "${COLOR_BLUE}Setting up frontend...${COLOR_RESET}"
cd "$PROJECT_ROOT/frontend"

# Create .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${COLOR_GREEN}✓${COLOR_RESET} Created .env from .env.example"
    else
        echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} .env.example not found. You may need to create .env manually."
    fi
else
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} .env file already exists"
fi

# Install dependencies
echo -e "${COLOR_BLUE}Installing frontend dependencies...${COLOR_RESET}"
pnpm install

echo -e "${COLOR_GREEN}✓${COLOR_RESET} Frontend setup complete!"
echo ""

# Setup Docker services
echo -e "${COLOR_BLUE}Setting up Docker services...${COLOR_RESET}"
cd "$PROJECT_ROOT/docker"

# Create .env.local from .env.example if it doesn't exist
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${COLOR_GREEN}✓${COLOR_RESET} Created .env.local from .env.example"
    else
        echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} .env.example not found. You may need to create .env.local manually."
    fi
else
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} .env.local file already exists"
fi

echo ""
echo -e "${COLOR_GREEN}✅ Development environment setup complete!${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}Next steps:${COLOR_RESET}"
echo ""
echo -e "1. Start Docker services (PostgreSQL, Redis, MinIO, Mailpit):"
echo -e "   ${COLOR_YELLOW}cd docker && docker compose -f docker-compose.local.yml up -d${COLOR_RESET}"
echo ""
echo -e "2. Run database migrations:"
echo -e "   ${COLOR_YELLOW}cd backend && poetry run python manage.py migrate${COLOR_RESET}"
echo ""
echo -e "3. Start the backend development server:"
echo -e "   ${COLOR_YELLOW}cd backend && poetry run python manage.py runserver${COLOR_RESET}"
echo ""
echo -e "4. Start Celery worker (in a separate terminal):"
echo -e "   ${COLOR_YELLOW}cd backend && poetry run celery -A watercrawl worker -B -l info${COLOR_RESET}"
echo ""
echo -e "5. Start the frontend development server (in another terminal):"
echo -e "   ${COLOR_YELLOW}cd frontend && pnpm run dev${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}Access points:${COLOR_RESET}"
echo -e "  - Frontend: http://localhost:5173"
echo -e "  - Backend API: http://localhost:8000/api"
echo -e "  - API Documentation: http://localhost:8000/api/schema/swagger-ui/"
echo -e "  - MinIO Console: http://localhost:9001"
echo -e "  - Mailpit (Email Testing): http://localhost:8025"
echo ""

