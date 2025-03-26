#!/bin/bash

# Colors for terminal output
COLOR_RESET="\033[0m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[0;33m"
COLOR_RED="\033[0;31m"
COLOR_BLUE="\033[0;34m"

echo -e "${COLOR_BLUE}Running pre-commit checks for both backend and frontend...${COLOR_RESET}"

# Run backend linting via pre-commit
echo -e "${COLOR_BLUE}Running backend checks via pre-commit...${COLOR_RESET}"
pre-commit run --all-files

BACKEND_STATUS=$?

# Run frontend linting
echo -e "${COLOR_BLUE}Running frontend linting...${COLOR_RESET}"
cd frontend && pnpm run lint

FRONTEND_STATUS=$?

# Check if either linting failed
if [ $BACKEND_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
    echo -e "${COLOR_RED}Linting checks failed. Please fix the issues before committing.${COLOR_RESET}"
    exit 1
fi

echo -e "${COLOR_GREEN}All linting checks passed!${COLOR_RESET}"
exit 0
