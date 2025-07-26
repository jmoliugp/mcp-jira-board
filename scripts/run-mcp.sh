#!/bin/bash

# Run MCP Server script for direct testing

set -e

echo "🚀 Starting Jira MCP Server..."

# Load environment variables directly from .env file
if [ -f .env ]; then
    echo "📄 Loading environment from: .env"
    # Read variables directly from .env file
    JIRA_BASE_URL=$(grep "^JIRA_BASE_URL=" .env | cut -d'=' -f2-)
    JIRA_EMAIL=$(grep "^JIRA_EMAIL=" .env | cut -d'=' -f2-)
    JIRA_API_TOKEN=$(grep "^JIRA_API_TOKEN=" .env | cut -d'=' -f2-)
    OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d'=' -f2-)
    echo "✅ Environment loaded from current directory"
elif [ -f ../.env ]; then
    echo "📄 Loading environment from: ../.env"
    # Read variables directly from parent .env file
    JIRA_BASE_URL=$(grep "^JIRA_BASE_URL=" ../.env | cut -d'=' -f2-)
    JIRA_EMAIL=$(grep "^JIRA_EMAIL=" ../.env | cut -d'=' -f2-)
    JIRA_API_TOKEN=$(grep "^JIRA_API_TOKEN=" ../.env | cut -d'=' -f2-)
    OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" ../.env | cut -d'=' -f2-)
    echo "✅ Environment loaded from parent directory"
else
    echo "⚠️  No .env file found"
fi

# Check if environment variables are set
if [ -z "$JIRA_BASE_URL" ] || [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
    echo "❌ Required environment variables not set"
    echo "   Please set: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN"
    echo ""
    echo "📝 You can:"
    echo "   1. Set them in your shell:"
    echo "      export JIRA_BASE_URL=https://your-domain.atlassian.net"
    echo "      export JIRA_EMAIL=your-email@example.com"
    echo "      export JIRA_API_TOKEN=your-jira-api-token"
    echo ""
    echo "   2. Or create a .env file and source it:"
    echo "      source .env"
    echo ""
    echo "   3. Or use the setup script:"
    echo "      pnpm docker:setup"
    exit 1
fi

# Check if Docker image exists
if ! docker images | grep -q "jira-mcp-server"; then
    echo "❌ Docker image not found. Building..."
    pnpm docker:build
fi

echo "✅ Starting MCP server with Docker..."
echo "📋 Environment:"
echo "   JIRA_BASE_URL: ${JIRA_BASE_URL:0:30}..."
echo "   JIRA_EMAIL: ${JIRA_EMAIL:0:20}..."
echo "   JIRA_API_TOKEN: ${JIRA_API_TOKEN:0:10}..."

            # Run the MCP SSE server
            docker run -d --rm --init \
              -p 3001:3001 \
              -e JIRA_BASE_URL="$JIRA_BASE_URL" \
              -e JIRA_EMAIL="$JIRA_EMAIL" \
              -e JIRA_API_TOKEN="$JIRA_API_TOKEN" \
              -e OPENAI_API_KEY="$OPENAI_API_KEY" \
              --name jira-mcp-server \
              jira-mcp-server:latest 