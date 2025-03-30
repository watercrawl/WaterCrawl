.PHONY: help install-backend install-frontend install-precommit lint-backend lint-frontend run-precommit install clean pre-commit-all

# Colors for terminal output
COLOR_RESET = \033[0m
COLOR_GREEN = \033[0;32m
COLOR_YELLOW = \033[0;33m
COLOR_RED = \033[0;31m
COLOR_BLUE = \033[0;34m

# Default target when just running 'make'
.DEFAULT_GOAL := help

# Show help
help:
	@echo "WaterCrawl Monorepo Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  ${COLOR_BLUE}make install${COLOR_RESET}              Install all dependencies (backend, frontend, pre-commit)"
	@echo "  ${COLOR_BLUE}make install-backend${COLOR_RESET}      Install backend dependencies using Poetry"
	@echo "  ${COLOR_BLUE}make install-frontend${COLOR_RESET}     Install frontend dependencies using pnpm"
	@echo "  ${COLOR_BLUE}make install-precommit${COLOR_RESET}    Install pre-commit hooks"
	@echo "  ${COLOR_BLUE}make lint-backend${COLOR_RESET}         Run Ruff linter and formatter on backend code"
	@echo "  ${COLOR_BLUE}make lint-frontend${COLOR_RESET}        Run ESLint on frontend code"
	@echo "  ${COLOR_BLUE}make run-precommit${COLOR_RESET}        Run pre-commit hooks (Ruff for backend only)"
	@echo "  ${COLOR_BLUE}make lint${COLOR_RESET}                 Run all linters (backend and frontend)"
	@echo "  ${COLOR_BLUE}make pre-commit-all${COLOR_RESET}       Run all checks before committing (backend and frontend)"
	@echo "  ${COLOR_BLUE}make clean${COLOR_RESET}                Clean up temporary files and caches"
	@echo ""
	@echo "Note: Frontend linting is handled separately from pre-commit due to SSL certificate issues"
	@echo ""

# Install all dependencies
install: install-backend install-frontend install-precommit
	@echo "${COLOR_GREEN}All dependencies installed successfully!${COLOR_RESET}"

# Install backend dependencies
install-backend:
	@echo "${COLOR_BLUE}Installing backend dependencies...${COLOR_RESET}"
	@if ! command -v poetry &> /dev/null; then \
		echo "${COLOR_RED}Error: Poetry is not installed.${COLOR_RESET}"; \
		echo "${COLOR_YELLOW}Please install Poetry first: https://python-poetry.org/docs/#installation${COLOR_RESET}"; \
		exit 1; \
	fi
	@cd backend && poetry install --no-interaction || { echo "${COLOR_RED}Failed to install backend dependencies.${COLOR_RESET}"; exit 1; }
	@echo "${COLOR_GREEN}Backend dependencies installed successfully!${COLOR_RESET}"

# Install frontend dependencies
install-frontend:
	@echo "${COLOR_BLUE}Installing frontend dependencies...${COLOR_RESET}"
	@if ! command -v pnpm &> /dev/null; then \
		echo "${COLOR_YELLOW}pnpm not found, attempting to install it...${COLOR_RESET}"; \
		npm install -g pnpm || { echo "${COLOR_RED}Failed to install pnpm. Please install manually: https://pnpm.io/installation${COLOR_RESET}"; exit 1; }; \
	fi
	@cd frontend && pnpm install || { echo "${COLOR_RED}Failed to install frontend dependencies.${COLOR_RESET}"; exit 1; }
	@echo "${COLOR_GREEN}Frontend dependencies installed successfully!${COLOR_RESET}"

# Install pre-commit hooks
install-precommit:
	@echo "${COLOR_BLUE}Installing pre-commit hooks...${COLOR_RESET}"
	@if ! command -v pre-commit &> /dev/null; then \
		echo "${COLOR_YELLOW}pre-commit not found. Installing via pip...${COLOR_RESET}"; \
		pip3 install pre-commit || { echo "${COLOR_RED}Failed to install pre-commit. Please install manually.${COLOR_RESET}"; exit 1; }; \
	fi
	@pre-commit install || { echo "${COLOR_RED}Failed to install pre-commit hooks.${COLOR_RESET}"; exit 1; }
	@echo "${COLOR_GREEN}Pre-commit hooks installed successfully!${COLOR_RESET}"

# Run backend linting and formatting
lint-backend:
	@echo "${COLOR_BLUE}Running Ruff linter and formatter on backend code...${COLOR_RESET}"
	@if [ ! -d "backend" ]; then \
		echo "${COLOR_RED}Error: backend directory not found.${COLOR_RESET}"; \
		exit 1; \
	fi
	@cd backend && poetry run ruff check . --fix || { echo "${COLOR_RED}Ruff linting failed.${COLOR_RESET}"; exit 1; }
	@cd backend && poetry run ruff format . || { echo "${COLOR_RED}Ruff formatting failed.${COLOR_RESET}"; exit 1; }
	@echo "${COLOR_GREEN}Backend code linted and formatted successfully!${COLOR_RESET}"

# Run frontend linting
lint-frontend:
	@echo "${COLOR_BLUE}Running ESLint on frontend code...${COLOR_RESET}"
	@if [ ! -d "frontend" ]; then \
		echo "${COLOR_RED}Error: frontend directory not found.${COLOR_RESET}"; \
		exit 1; \
	fi
	@cd frontend && pnpm run lint || { echo "${COLOR_RED}ESLint failed.${COLOR_RESET}"; exit 1; }
	@echo "${COLOR_GREEN}Frontend code linted successfully!${COLOR_RESET}"

# Run all linters
lint: lint-backend lint-frontend
	@echo "${COLOR_GREEN}All code linted successfully!${COLOR_RESET}"

# Run all pre-commit hooks
run-precommit:
	@echo "${COLOR_BLUE}Running pre-commit on all files...${COLOR_RESET}"
	@if ! command -v pre-commit &> /dev/null; then \
		echo "${COLOR_RED}Error: pre-commit is not installed.${COLOR_RESET}"; \
		echo "${COLOR_YELLOW}Please run 'make install-precommit' first.${COLOR_RESET}"; \
		exit 1; \
	fi
	@pre-commit run --all-files || { echo "${COLOR_RED}Pre-commit hooks failed.${COLOR_RESET}"; exit 1; }
	@echo "${COLOR_GREEN}Pre-commit hooks ran successfully!${COLOR_RESET}"

# Run all checks before committing
pre-commit-all: lint-backend lint-frontend run-precommit
	@echo "${COLOR_GREEN}All pre-commit checks passed successfully!${COLOR_RESET}"

# Clean up temporary files and caches
clean:
	@echo "${COLOR_BLUE}Cleaning up temporary files and caches...${COLOR_RESET}"
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type d -name "*.egg-info" -exec rm -rf {} +
	@find . -type d -name ".ruff_cache" -exec rm -rf {} +
	@find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@find . -type d -name ".mypy_cache" -exec rm -rf {} +
	@find . -type d -name "node_modules" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@find . -type f -name "*.pyo" -delete
	@find . -type f -name "*.pyd" -delete
	@find . -type f -name ".DS_Store" -delete
	@find . -type d -name ".coverage" -delete
	@find . -type f -name "coverage.xml" -delete
	@find . -type d -name "htmlcov" -exec rm -rf {} +
	@find . -type f -name ".coverage.*" -delete
	@pre-commit clean || true
	@echo "${COLOR_GREEN}Cleanup complete!${COLOR_RESET}"
