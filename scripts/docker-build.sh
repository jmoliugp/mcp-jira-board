#!/bin/bash

# Unified Docker script for Jira MCP Server (setup, build, test)

set -e

echo "🚀 Jira MCP Server Docker Setup & Build"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is installed and running"

# Create .env file if it doesn't exist (check current dir and parent dir)
if [ ! -f .env ] && [ ! -f ../.env ]; then
    echo "📝 Creating .env file template..."
    echo "   Creating in parent directory (../.env)..."
    cat > ../.env << EOF
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
EOF
    echo "✅ Created .env file template"
    echo "⚠️  Please edit .env file with your actual credentials"
else
    echo "✅ .env file already exists"
fi

# Build the Docker image
echo "🐳 Building Jira MCP Server Docker image..."
docker build -t jira-mcp-server:latest .

echo "✅ Docker image built successfully!"
echo "📦 Image: jira-mcp-server:latest"

# Test the container
echo "🧪 Testing Docker container..."
./scripts/test-docker.sh

echo ""
echo "🎉 Setup & Build completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file with your actual Jira credentials"
echo "   2. Configure Cursor to use the MCP server"
echo "   3. Restart Cursor"
echo ""
echo "🔧 Available commands:"
echo "   pnpm docker:build     - Build Docker image (this command)"
echo "   pnpm docker:test      - Test Docker container"
echo "   pnpm docker:status    - Check Docker status"
echo "   pnpm docker:start     - Run MCP server"
echo "   pnpm docker:run       - Run container manually"
echo "   pnpm docker:compose:up - Start with docker-compose"
echo "   pnpm docker:dev       - Development mode with rebuild"
echo "   pnpm docker:clean     - Remove Docker image"
echo "   pnpm docker:rebuild   - Clean and rebuild" 