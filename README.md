# Jira MCP Server

A Model Context Protocol (MCP) server that provides Jira board and backlog management functionality. This server can be run as a standalone HTTP server using Server-Sent Events (SSE) or Streamable HTTP, allowing Cursor and other MCP clients to connect to it.

## Features

- **Board Management**: Create, list, get, and delete Jira boards
- **Project Management**: Create, list, get, update, and delete Jira projects
- **Backlog Management**: Move issues to and from backlogs
- **Board Operations**: Get board issues, epics, sprints, and backlogs
- **SSE/HTTP Transport**: Support for both SSE and Streamable HTTP connections
- **Docker Support**: Easy deployment and management with Docker

## Quick Start

### 1. Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd mcp-jira-board

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### 2. Configure Environment Variables

Create a `.env` file with your Jira credentials:

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

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key
```

### 3. Build and Start Docker Server

```bash
# Build Docker image and start SSE server
pnpm docker:build

# Start the MCP server (runs in background)
pnpm docker:start

# Check status
pnpm docker:status

# Test SSE connection
pnpm docker:test-sse
```

### 4. Configure Cursor

Add this to your `mcp-config.json`:

```json
{
  "mcpServers": {
    "jira-mcp-server": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

### 5. Restart Cursor

Restart Cursor to load the new MCP server configuration.

## Available Commands

### Docker Commands

```bash
# Build and setup
pnpm docker:build          # Build Docker image and setup environment
pnpm docker:rebuild        # Clean and rebuild Docker image

# Server management
pnpm docker:start          # Start MCP server in background
pnpm docker:stop           # Stop MCP server
pnpm docker:status         # Check server status

# Testing
pnpm docker:test           # Test Docker container
pnpm docker:test-sse       # Test SSE connection

# Development
pnpm docker:dev            # Development mode with auto-rebuild
pnpm docker:compose:up     # Start with docker-compose
pnpm docker:compose:down   # Stop docker-compose
pnpm docker:compose:logs   # View logs

# Cleanup
pnpm docker:clean          # Remove Docker image
```

### Development Commands

```bash
# Build and run locally
pnpm build                 # Build TypeScript
pnpm start                 # Run locally (stdio mode)
pnpm dev                   # Development mode with watch

# Testing
pnpm test:unit             # Run unit tests
pnpm test:integration      # Run integration tests
pnpm test:all              # Run all tests

# MCP testing
pnpm mcp:test              # Test MCP server locally
pnpm mcp:start             # Start MCP server locally (stdio)
```

## Architecture

### Transport Modes

The MCP server supports two transport modes:

1. **SSE (Server-Sent Events)**: Used for HTTP-based connections
   - Endpoint: `http://localhost:3001/sse`
   - Suitable for web-based MCP clients

2. **Streamable HTTP**: Alternative HTTP transport
   - Endpoint: `http://localhost:3001/mcp`
   - More efficient for some clients

3. **Stdio**: Traditional MCP transport
   - Used for direct process communication
   - Available via `pnpm mcp:start`

### Server Modes

- **Standalone SSE Server**: Runs as HTTP server on port 3001
- **Docker Container**: Runs in Docker with port mapping
- **Local Development**: Runs directly with stdio transport

## API Tools

### Board Management

- `jira_get_all_boards`: Retrieve all boards with optional filtering
- `jira_create_board`: Create a new scrum or kanban board
- `jira_get_board_by_id`: Get board details by ID
- `jira_delete_board`: Delete a board by ID

### Project Management

- `jira_create_project`: Create a new Jira project with automatic admin privileges
- `jira_get_all_projects`: Retrieve all projects with optional filtering
- `jira_get_project`: Get project details by ID or key
- `jira_update_project`: Update project information
- `jira_delete_project`: Delete a project
- `jira_create_project_with_board`: Create a project with an associated board and admin privileges

### Issue Management

- `jira_get_issue_types`: Get all available issue types
- `jira_get_project_issue_types`: Get issue types available for a specific project
- `jira_create_user_story`: Create a user story in a project
- `jira_create_bug`: Create a bug in a project
- `jira_create_issue`: Create any type of issue
- `jira_get_issue`: Get issue details by key or ID
- `jira_get_issue_transitions`: Get available status transitions for an issue
- `jira_update_issue`: Update issue fields (assignee, priority, status, summary, description) and add comments
- `jira_delete_issue`: Delete an issue by key or ID
- `jira_search_issues`: Search for issues using JQL
- `jira_validate_jql`: Validate JQL queries and get suggestions

### AI Story Estimation

- `jira_ai_estimate_stories_in_project`: AI-powered automatic estimation of unestimated stories with default story points
- `jira_get_project_ai_estimation_stats`: Get AI estimation statistics for a project

### Board Operations

- `jira_get_board_backlog`: Get issues in board backlog
- `jira_get_board_epics`: Get epics for a board
- `jira_get_board_sprints`: Get sprints for a board
- `jira_get_board_issues`: Get issues for a board
- `jira_move_issues_to_board`: Move issues to a board

### Backlog Management

- `jira_move_issues_to_backlog`: Move issues to backlog
- `jira_move_issues_to_backlog_for_board`: Move issues to specific board backlog

### Resources

- `jira://boards`: List of all boards
- `jira://board/{boardId}`: Specific board details with backlog, epics, and sprints

## Usage Examples

### Updating Issue Status and Assignee

```typescript
// First, get available transitions for an issue
const transitions = await jira_get_issue_transitions({
  issueKeyOrId: 'PROJ-123',
});

// Update the issue with new assignee, priority, and status
const result = await jira_update_issue({
  issueKeyOrId: 'PROJ-123',
  assigneeAccountId: 'user123',
  priorityId: '2', // High priority
  transitionId: '21', // In Progress status
  comment: 'Assigned to development team and started work',
});
```

### Adding Comments and Changing Priority

```typescript
// Add a comment and change priority without changing status
const result = await jira_update_issue({
  issueKeyOrId: 'PROJ-123',
  priorityId: '1', // Highest priority
  comment: 'Escalated to highest priority due to customer impact',
});
```

### Unassigning an Issue

```typescript
// Remove assignee from an issue
const result = await jira_update_issue({
  issueKeyOrId: 'PROJ-123',
  unassign: true,
  comment: 'Unassigned for review and reassignment',
});
```

### AI Story Estimation

```typescript
// AI-estimate all unestimated stories in a project with default 3 story points
const result = await jira_ai_estimate_stories_in_project({
  projectKey: 'FITPULSE',
});

// AI-estimate with custom story points and label
const result = await jira_ai_estimate_stories_in_project({
  projectKey: 'FITPULSE',
  defaultStoryPoints: 5,
  estimationLabel: 'ai-estimated',
});

// Get AI estimation statistics for a project
const stats = await jira_get_project_ai_estimation_stats({
  projectKey: 'FITPULSE',
});
```

// Field Configuration and Custom Fields tools have been removed to simplify the codebase

### JQL Best Practices

```typescript
// Validate JQL before searching
const validation = await jira_validate_jql({
  jql: 'project = FITPULSE AND "Story Points" is EMPTY',
});

// Use recommended queries
const issues = await jira_search_issues({
  jql: 'project = FITPULSE AND timeoriginalestimate is EMPTY',
  maxResults: 10,
});
```

**Common JQL Issues:**

- Use `timeoriginalestimate` instead of `"Story Points"`
- Use `is EMPTY` for standard fields, `is null` for custom fields
- Always start with `project = PROJECT_KEY`
- Avoid custom field names in quotes unless they exist

````

## Troubleshooting

### Common Issues

1. **Server not starting**: Check Docker is running and port 3001 is available
2. **Connection refused**: Ensure the server is running with `pnpm docker:status`
3. **Authentication errors**: Verify Jira credentials in `.env` file
4. **Cursor not connecting**: Restart Cursor after updating `mcp-config.json`

### Debug Commands

```bash
# Check server logs
docker logs jira-mcp-server

# Test connectivity
curl http://localhost:3001/sse

# Check environment variables
pnpm docker:status
````

## Development

### Project Structure

```
src/
├── mcps/
│   ├── index.ts          # Stdio MCP server
│   └── server-sse.ts     # SSE/HTTP MCP server
├── services/
│   └── jira/
│       ├── board.ts      # Board management
│       └── backlog.ts    # Backlog management
└── utils/
    ├── config.ts         # Configuration
    ├── log.ts           # Logging
    └── error.ts         # Error handling
```

### Adding New Tools

1. Add tool registration in `src/mcps/server-sse.ts`
2. Implement service functions in `src/services/jira/`
3. Add tests in `src/services/jira/*.test.ts`
4. Update documentation

## License

MIT
