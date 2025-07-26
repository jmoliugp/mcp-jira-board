# Docker Setup for Jira MCP Server

This document explains how to run the Jira MCP Server using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)
- Jira API credentials

## Quick Start

### 1. Build the Docker Image

```bash
# Using the build script
./scripts/docker-build.sh

# Or manually
docker build -t jira-mcp-server:latest .
```

### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Optional Jira Settings
JIRA_API_TIMEOUT=10000
JIRA_API_RETRY_ATTEMPTS=3
JIRA_API_RETRY_DELAY=1000
JIRA_LOG_LEVEL=info
JIRA_LOG_REQUESTS=false
JIRA_LOG_RESPONSES=false
JIRA_RATE_LIMIT_ENABLED=true
JIRA_RATE_LIMIT_REQUESTS_PER_MINUTE=1000
JIRA_ENVIRONMENT=cloud

# OpenAI Configuration (if needed)
OPENAI_API_KEY=your-openai-api-key

# Node Environment
NODE_ENV=production
```

### 3. Run with Docker Compose

```bash
# Start the service
docker-compose up

# Run in background
docker-compose up -d

# Stop the service
docker-compose down
```

### 4. Run with Docker directly

```bash
docker run -i --rm --init \
  -e JIRA_BASE_URL=https://your-domain.atlassian.net \
  -e JIRA_EMAIL=your-email@example.com \
  -e JIRA_API_TOKEN=your-jira-api-token \
  -e JIRA_API_TIMEOUT=10000 \
  -e JIRA_API_RETRY_ATTEMPTS=3 \
  -e JIRA_API_RETRY_DELAY=1000 \
  -e JIRA_LOG_LEVEL=info \
  -e JIRA_LOG_REQUESTS=false \
  -e JIRA_LOG_RESPONSES=false \
  -e JIRA_RATE_LIMIT_ENABLED=true \
  -e JIRA_RATE_LIMIT_REQUESTS_PER_MINUTE=1000 \
  -e JIRA_ENVIRONMENT=cloud \
  -e OPENAI_API_KEY=your-openai-api-key \
  jira-mcp-server:latest
```

## Configuration with Cursor

### Update MCP Config

The `mcp-config.json` file is already configured to use Docker. Make sure your environment variables are set in your shell or system environment.

### Environment Variables in Cursor

You can set environment variables in Cursor's settings or in your shell profile:

```bash
export JIRA_BASE_URL=https://your-domain.atlassian.net
export JIRA_EMAIL=your-email@example.com
export JIRA_API_TOKEN=your-jira-api-token
export OPENAI_API_KEY=your-openai-api-key
```

## Development with Docker

### Build and Run for Development

```bash
# Build the image
docker build -t jira-mcp-server:dev .

# Run with volume mount for development
docker run -i --rm --init \
  -v $(pwd)/src:/app/src:ro \
  -v $(pwd)/dist:/app/dist \
  -e JIRA_BASE_URL=your-url \
  -e JIRA_EMAIL=your-email \
  -e JIRA_API_TOKEN=your-token \
  jira-mcp-server:dev
```

### Using Docker Compose for Development

```bash
# Start with development configuration
docker-compose -f docker-compose.dev.yml up
```

## Troubleshooting

### Check Container Logs

```bash
# With docker-compose
docker-compose logs jira-mcp-server

# With docker
docker logs <container-id>
```

### Health Check

The container includes a health check. You can verify it's working:

```bash
docker ps
```

### Environment Variables

Verify environment variables are set correctly:

```bash
docker run --rm jira-mcp-server:latest env | grep JIRA
```

### Common Issues

1. **Permission Denied**: Make sure the build script is executable

   ```bash
   chmod +x scripts/docker-build.sh
   ```

2. **Environment Variables Not Set**: Ensure all required environment variables are set

   ```bash
   echo $JIRA_BASE_URL
   echo $JIRA_EMAIL
   echo $JIRA_API_TOKEN
   ```

3. **Port Conflicts**: The container exposes port 3000 for health checks. If you have conflicts, modify the docker-compose.yml file.

## Security Considerations

- The container runs as a non-root user (nodejs:1001)
- Environment variables containing sensitive data should be managed securely
- Consider using Docker secrets for production deployments
- The container is configured with health checks and restart policies

## Production Deployment

For production deployments, consider:

1. Using Docker secrets for sensitive data
2. Setting up proper logging and monitoring
3. Using a reverse proxy (nginx, traefik)
4. Implementing proper backup strategies
5. Setting up container orchestration (Kubernetes, Docker Swarm)
