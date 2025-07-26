#!/bin/bash

# Status script for Jira MCP Server Docker environment

echo "🔍 Checking Jira MCP Server Docker status..."

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

# Check if Docker image exists
if docker images | grep -q "jira-mcp-server"; then
    echo "✅ Docker image exists:"
    docker images | grep jira-mcp-server
else
    echo "❌ Docker image not found"
fi

echo ""

# Check if containers are running
if docker ps | grep -q "jira-mcp-server"; then
    echo "✅ Running containers:"
    docker ps | grep jira-mcp-server
else
    echo "ℹ️  No running containers found"
fi

echo ""

# Check environment variables
echo "🔧 Environment variables:"
if [ -n "$JIRA_BASE_URL" ]; then
    echo "✅ JIRA_BASE_URL: ${JIRA_BASE_URL:0:20}..."
else
    echo "❌ JIRA_BASE_URL: not set"
fi

if [ -n "$JIRA_EMAIL" ]; then
    echo "✅ JIRA_EMAIL: ${JIRA_EMAIL:0:8}..."
else
    echo "❌ JIRA_EMAIL: not set"
fi

if [ -n "$JIRA_API_TOKEN" ]; then
    echo "✅ JIRA_API_TOKEN: ${JIRA_API_TOKEN:0:6}..."
else
    echo "❌ JIRA_API_TOKEN: not set"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY: ${OPENAI_API_KEY:0:8}..."
else
    echo "❌ OPENAI_API_KEY: not set"
    echo "   Note: This variable is optional for basic MCP functionality"
fi

echo ""

# Check .env file (check current dir and parent dir)
if [ -f .env ]; then
    echo "✅ .env file exists (current directory)"
elif [ -f ../.env ]; then
    echo "✅ .env file exists (parent directory)"
else
    echo "❌ .env file not found (checked current and parent directories)"
fi

echo ""

# Check MCP config
if [ -f mcp-config.json ]; then
    echo "✅ mcp-config.json exists"
else
    echo "❌ mcp-config.json not found"
fi

echo ""
echo "📝 Quick commands:"
echo "   pnpm docker:status    - Show this status"
echo "   pnpm docker:test      - Test the container"
echo "   pnpm docker:compose:up - Start with docker-compose"
echo "   pnpm docker:clean     - Remove Docker image" 