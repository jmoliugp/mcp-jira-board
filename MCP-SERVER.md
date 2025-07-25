# Jira MCP Server

This project provides a Model Context Protocol (MCP) server that exposes Jira board management functionality as tools and resources for AI assistants.

## Features

### Tools Available

#### Board Management

- **`jira_get_all_boards`** - Retrieve all boards visible to the user with optional filtering
- **`jira_create_board`** - Create a new scrum or kanban board
- **`jira_get_board_by_id`** - Retrieve board details by board ID
- **`jira_delete_board`** - Delete a board by ID
- **`jira_get_board_backlog`** - Get issues in the backlog of a board
- **`jira_get_board_epics`** - Get epics for a board
- **`jira_get_board_sprints`** - Get sprints for a board
- **`jira_get_board_issues`** - Get issues for a board
- **`jira_move_issues_to_board`** - Move issues to a board with optional ranking

#### Backlog Management

- **`jira_move_issues_to_backlog`** - Move issues to the backlog (remove from sprints)
- **`jira_move_issues_to_backlog_for_board`** - Move issues to the backlog of a specific board

### Resources Available

- **`jira://board/{boardId}`** - Access comprehensive board information including board details, backlog, epics, and sprints
- **`jira://boards`** - Access list of all boards

## Usage

### Starting the MCP Server

```bash
# Test the server
pnpm mcp:test

# Start the server directly
pnpm mcp:start
```

### Configuration

The server uses the same configuration as the Jira services:

1. Set up your environment variables in `.env`:

   ```
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-api-token
   ```

2. Or use the `env.example` as a template:
   ```bash
   cp env.example .env
   # Edit .env with your Jira credentials
   ```

### Integration with AI Assistants

The MCP server can be integrated with AI assistants that support the Model Context Protocol. The server exposes all Jira board management functionality as structured tools and resources.

#### Example Tool Usage

```typescript
// Get all boards
const boards = await callTool('jira_get_all_boards', {
  maxResults: 10,
  type: 'scrum',
});

// Create a new board
const newBoard = await callTool('jira_create_board', {
  name: 'My New Board',
  type: 'scrum',
  filterId: 12345,
});

// Get board backlog
const backlog = await callTool('jira_get_board_backlog', {
  boardId: 123,
  maxResults: 20,
});
```

#### Example Resource Usage

```typescript
// Get comprehensive board information
const boardInfo = await getResource('jira://board/123');

// Get all boards list
const boardsList = await getResource('jira://boards');
```

## Error Handling

The MCP server includes comprehensive error handling:

- **UserInputError** (400) - Invalid input parameters
- **AuthenticationError** (401) - Authentication failed
- **ForbiddenError** (403) - Access forbidden
- **NotFoundError** (404) - Resource not found
- **InternalServerError** (500+) - Server errors

All errors are logged with context and proper error messages are returned to the client.

## Performance Monitoring

All operations include performance logging with execution time tracking:

```
⏱️ jira_get_all_boards executed in 245.67ms
⏱️ jira_create_board executed in 1234.56ms
```

## Development

### Testing

```bash
# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run all tests
pnpm test:all
```

### Adding New Tools

To add new tools to the MCP server:

1. Implement the service function in `src/services/jira/`
2. Add the tool registration in `src/mcps/index.ts`
3. Include proper error handling and logging
4. Add unit tests for the new functionality

### Adding New Resources

To add new resources:

1. Define the resource template with proper URI pattern
2. Implement the resource handler function
3. Include error handling and logging
4. Test the resource functionality

## Architecture

The MCP server follows a clean architecture pattern:

- **MCP Layer** (`src/mcps/`) - Protocol implementation and tool/resource registration
- **Service Layer** (`src/services/jira/`) - Business logic and API integration
- **Utility Layer** (`src/utils/`) - Shared utilities for logging, error handling, and configuration

This separation ensures maintainability and testability of the codebase.
