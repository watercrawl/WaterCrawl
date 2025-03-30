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

3. Setup git upstream:
    ```bash
    cd watercrawl
    git remote add upstream https://github.com/watercrawl/watercrawl.git
    ```

4. Install frontend and backend dependencies:
    ```bash
    make install
    ```

5. Start the development requirements containers:
    ```bash
    cd docker
    cp .env.local .env
    docker compose up -d
    ```

6. Start backend development server (run in separate terminals):
    ```bash
    cd backend
    cp app.env.example app.env
    poetry run python manage.py runserver
    poetry run celery -A watercrawl --beat worker -l info
    ```

7. Start frontend development server:
    ```bash
    cd frontend
    cp .env.example .env
    npm run dev
    ```

### Setting up Pre-commit Hooks

We use pre-commit hooks to ensure code quality. Install them after setting up your development environment:

```bash
pre-commit install
```

This will set up:
- Ruff for Python code linting and formatting
- ESLint for TypeScript/React code linting
- Additional code quality checks

## Development Workflow

1. **Create an Issue First**
   - All pull requests must be associated with an issue
   - Create a new issue describing the bug or feature before starting work
   - Wait for issue to be triaged and approved

2. **Code Quality**
   - Follow the linting rules configured in:
     - Backend: `backend/pyproject.toml` (Ruff)
     - Frontend: `.eslintrc.js` and `eslint.config.js`
   - Run linting checks locally:
     ```bash
     ./lint.sh
     ```
   - Fix any linting issues before committing

3. **Making Changes**
   - Create a new branch from `main`
   - Make your changes
   - Write or update tests as needed
   - Commit your changes using conventional commit messages

4. **Creating Pull Requests**
   - Link the related issue in your PR description
   - Include screenshots for UI changes
   - Ensure all checks pass
   - Request review from maintainers

## Pull Request Guidelines

- Keep PRs focused and atomic
- Update documentation as needed
- Include tests for new features
- Follow our code style guidelines
- Squash commits before merging

## Need Help?

Feel free to ask questions in:
- GitHub Discussions
- Issue comments
- Our community channels

Thank you for contributing to WaterCrawl! 🚀
