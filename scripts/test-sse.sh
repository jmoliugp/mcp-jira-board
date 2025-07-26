#!/bin/bash

# Test SSE connection to MCP server

set -e

echo "🧪 Testing SSE connection to Jira MCP server..."

# Check if server is running
if ! docker ps | grep -q "jira-mcp-server"; then
    echo "❌ MCP server is not running"
    echo "   Start it with: pnpm docker:start"
    exit 1
fi

echo "✅ MCP server is running"

# Test SSE endpoint
echo "🔌 Testing SSE endpoint: http://localhost:3001/sse"

# Test basic connectivity
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/sse | grep -q "200"; then
    echo "✅ SSE endpoint is responding"
else
    echo "❌ SSE endpoint is not responding"
    echo "   Check if the server is running properly"
    exit 1
fi

# Test MCP endpoint
echo "🔌 Testing MCP endpoint: http://localhost:3001/mcp"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/mcp | grep -q "400"; then
    echo "✅ MCP endpoint is responding (400 is expected for GET without session)"
else
    echo "❌ MCP endpoint is not responding correctly"
    exit 1
fi

echo ""
echo "🎉 SSE connection test passed!"
echo ""
echo "📋 Cursor configuration:"
echo "   Add this to your mcp-config.json:"
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"jira-mcp-server\": {"
echo "         \"url\": \"http://localhost:3001/sse\""
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "🌐 Server is ready for Cursor to connect!" 