# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set the dummy API URL that will be replaced at runtime
ENV NODE_ENV=production
ENV DOCUSAURUS_SSR_CONCURRENCY=5

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest yarn@latest  --activate

FROM builder AS production

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["pnpm", "serve", "--port", "3000", "--host", "0.0.0.0"]
