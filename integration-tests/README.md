# Integration Tests

This directory contains integration tests for the Jira MCP Server. These tests run against the real Jira API to verify that our services work correctly in a real environment.

## Overview

Integration tests are different from unit tests in that they:

- **Test against real APIs**: They make actual HTTP requests to Jira
- **Require valid credentials**: Need proper Jira configuration
- **Test complete workflows**: Verify end-to-end functionality
- **Handle real data**: Work with actual boards, issues, and projects

## Prerequisites

Before running integration tests, ensure you have:

1. **Valid Jira credentials** in your `.env` file:

   ```env
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@domain.com
   JIRA_API_TOKEN=your-api-token
   ```

2. **Access to Jira boards**: At least one board should be accessible with your credentials

3. **Network connectivity**: Ability to reach your Jira instance

## Running Integration Tests

### Run all integration tests:

```bash
pnpm test:integration
```

### Run specific integration test:

```bash
pnpm test:integration board.integration.test.ts
```

### Run with coverage:

```bash
pnpm test:integration --coverage
```

### Run with verbose output:

```bash
pnpm test:integration --reporter=verbose
```

## Test Structure

### Board Integration Tests (`board.integration.test.ts`)

Tests all board-related endpoints:

- **getAllBoards**: List all accessible boards
- **getBoardById**: Get specific board details
- **getBoardBacklog**: Get backlog issues
- **getBoardEpics**: Get board epics (Scrum boards)
- **getBoardEpicNoneIssues**: Get issues without epics
- **getBoardFeatures**: Get board features
- **getBoardIssues**: Get all board issues
- **getBoardProjects**: Get associated projects
- **getBoardSprints**: Get board sprints (Scrum boards)
- **getBoardVersions**: Get board versions
- **getBoardQuickFilters**: Get quick filters

### Backlog Integration Tests (`backlog.integration.test.ts`)

Tests backlog-related endpoints:

- **moveIssuesToBacklog**: Move issues to global backlog
- **moveIssuesToBacklogForBoard**: Move issues to specific board backlog

## Test Characteristics

### Graceful Error Handling

Integration tests are designed to handle cases where certain features might not be available:

- **Kanban boards**: Don't have epics or sprints
- **Empty boards**: Might not have issues or projects
- **Permission restrictions**: Some endpoints might be restricted

### Safe Testing

Tests are designed to be safe and not modify real data:

- **Read-only operations**: Most tests only read data
- **Empty arrays**: Write operations test with empty arrays
- **Invalid keys**: Test error handling with invalid data

### Realistic Scenarios

Tests cover realistic scenarios:

- **Pagination**: Test with different page sizes
- **Different board types**: Scrum vs Kanban
- **Error conditions**: Network issues, invalid data
- **Performance**: Timeout handling

## Configuration

### Timeouts

Integration tests have longer timeouts than unit tests:

- **Test timeout**: 30 seconds
- **Hook timeout**: 30 seconds

### Reporters

Tests generate multiple report formats:

- **Console**: Verbose output during execution
- **JSON**: Detailed results for CI/CD integration
- **Coverage**: Code coverage reports

## Troubleshooting

### Common Issues

1. **Authentication errors**: Check your Jira credentials
2. **Network timeouts**: Verify connectivity to Jira
3. **Permission errors**: Ensure your account has board access
4. **No boards found**: Create or get access to at least one board

### Debug Mode

Run tests with debug information:

```bash
DEBUG=* pnpm test:integration
```

### Environment Variables

You can override configuration:

```bash
JIRA_API_TIMEOUT=60000 pnpm test:integration
```

## CI/CD Integration

Integration tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Integration Tests
  run: pnpm test:integration
  env:
    JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
    JIRA_EMAIL: ${{ secrets.JIRA_EMAIL }}
    JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```

## Results

Test results are saved to:

- **Console output**: Real-time test progress
- **JSON report**: `integration-tests-results.json`
- **Coverage report**: `coverage/` directory (if enabled)
