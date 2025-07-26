#!/bin/bash

# MCP Wrapper script that loads .env and runs Docker container

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading environment from: .env" >&2
    # Export variables from .env file
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
            export "$line"
        fi
    done < .env
elif [ -f ../.env ]; then
    echo "📄 Loading environment from: ../.env" >&2
    # Export variables from parent .env file
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
            export "$line"
        fi
    done < ../.env
else
    echo "⚠️  No .env file found" >&2
fi

# Run the Docker container with loaded environment variables
exec docker run -i --rm --init \
  -e JIRA_BASE_URL="$JIRA_BASE_URL" \
  -e JIRA_EMAIL="$JIRA_EMAIL" \
  -e JIRA_API_TOKEN="$JIRA_API_TOKEN" \
  -e JIRA_API_TIMEOUT="${JIRA_API_TIMEOUT:-10000}" \
  -e JIRA_API_RETRY_ATTEMPTS="${JIRA_API_RETRY_ATTEMPTS:-3}" \
  -e JIRA_API_RETRY_DELAY="${JIRA_API_RETRY_DELAY:-1000}" \
  -e JIRA_LOG_LEVEL="${JIRA_LOG_LEVEL:-info}" \
  -e JIRA_LOG_REQUESTS="${JIRA_LOG_REQUESTS:-false}" \
  -e JIRA_LOG_RESPONSES="${JIRA_LOG_RESPONSES:-false}" \
  -e JIRA_RATE_LIMIT_ENABLED="${JIRA_RATE_LIMIT_ENABLED:-true}" \
  -e JIRA_RATE_LIMIT_REQUESTS_PER_MINUTE="${JIRA_RATE_LIMIT_REQUESTS_PER_MINUTE:-1000}" \
  -e JIRA_ENVIRONMENT="${JIRA_ENVIRONMENT:-cloud}" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  jira-mcp-server:latest 