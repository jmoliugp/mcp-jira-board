#!/bin/bash

# Build script for Jira MCP Server Docker image

set -e

echo "🐳 Building Jira MCP Server Docker image..."

# Build the Docker image
docker build -t jira-mcp-server:latest .

echo "✅ Docker image built successfully!"
echo "📦 Image: jira-mcp-server:latest"
echo ""
echo "🚀 To run the container:"
echo "   docker run -i --rm --init -e JIRA_BASE_URL=your-url -e JIRA_EMAIL=your-email -e JIRA_API_TOKEN=your-token jira-mcp-server:latest"
echo ""
echo "🔧 Or use docker-compose:"
echo "   docker-compose up" 