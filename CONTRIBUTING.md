# Contributing to WaterCrawl

Thank you for your interest in contributing to WaterCrawl! This document provides guidelines and instructions for contributing to the project.

## Security Issues

⚠️ **DO NOT** report security vulnerabilities through public GitHub issues. Please send security-related issues to [support@watercrawl.dev](mailto:support@watercrawl.dev).

## Development Setup

### Prerequisites

- Python version 3.13
- Node.js version 20
- PNPM: `corepack enable && corepack prepare pnpm@latest --activate`
- Poetry: `curl -sSL https://install.python-poetry.org | python3 -`
- Docker ([install guide](https://www.docker.com/get-docker))

### Installation Steps

1. Fork the repository

    - Go to [GitHub](https://github.com/watercrawl/watercrawl/fork) and click the "Create fork" button

2. Clone the repository:
    - Replace `USERNAME` with your GitHub username
    ```bash
    git clone https://github.com/USERNAME/watercrawl.git
    ```

3. Set up external dependencies using Docker:

    ```bash
    cd watercrawl/docker
    cp .env.local .env
    docker-compose -f docker-compose.local.yml up -d
    ```

    This will start PostgreSQL, Redis, MinIO, and Mailpit services needed for development.

4. Set up backend:

    ```bash
    cd ../backend
    
    # Setup Poetry environment
    poetry env use python3.13
    poetry shell
    
    # Install dependencies
    poetry install
    
    # Configure environment
    cp .env.example .env
    # Edit .env to point to the Docker services
    # Example: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
    
    # Run migrations
    python manage.py migrate
    
    # Create a superuser (if needed)
    python manage.py createsuperuser
    
    # Start development server
    python manage.py runserver
    ```

5. Set up frontend:

    ```bash
    cd ../frontend
    
    # Install dependencies
    pnpm install
    
    # Configure environment
    cp .env.example .env
    # Edit .env to point to your local backend
    # Example: API_BASE_URL=http://localhost:8000/api
    
    # Start development server
    pnpm run dev
    ```

6. Access the application:
    - Frontend: http://localhost:5173
    - Backend API: http://localhost:8000/api
    - API Documentation: http://localhost:8000/api/schema/swagger-ui/
    - MinIO Console: http://localhost:9001
    - Mailpit (Email Testing): http://localhost:8025


## Code Quality

### Linting

We use the following tools for linting:

- Backend (Python): [Ruff](https://github.com/astral-sh/ruff)
- Frontend (TypeScript/React): [ESLint](https://eslint.org/) with TypeScript and React plugins

To run linting checks:

```bash
# Backend
cd backend
poetry run ruff check

# Frontend
cd frontend
pnpm run lint
```

For automatic fixes where possible:

```bash
# Backend
cd backend
poetry run ruff check --fix

# Frontend
cd frontend
pnpm run lint:fix
```

Our CI pipeline automatically runs linting checks on pull requests. Please ensure your code passes these checks before submitting a PR.

## Submitting Changes

1. **Create an issue first**:
   - All pull requests must be associated with an issue
   - Create a new issue describing the bug or feature before starting work
   - You can begin development immediately after creating the issue

2. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit them with clear, descriptive commit messages.

4. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request from your branch to the main repository.

6. In your pull request description:
   - Reference the issue number (e.g., "Fixes #123" or "Relates to #123")
   - Clearly explain the changes you've made
   - Include screenshots for UI changes if applicable

## License

By contributing to WaterCrawl, you agree that your contributions will be licensed under the project's license.
