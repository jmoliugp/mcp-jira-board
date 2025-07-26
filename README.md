# Jira MCP Server

A Model Context Protocol (MCP) server that provides Jira board management functionality, allowing AI assistants to interact with Jira programmatically.

## 🚀 Quick Start

### 1. Setup with Docker (Recommended)

```bash
# Setup everything automatically (build, test, create .env)
pnpm docker:build

# Or manually:
pnpm docker:test
```

### 2. Configure Environment Variables

Create a `.env` file or set environment variables. The scripts will automatically look for the `.env` file in:

- Current directory (`./.env`)
- Parent directory (`../.env`)

You can create the `.env` file manually or use the setup script:

```bash
export JIRA_BASE_URL=https://your-domain.atlassian.net
export JIRA_EMAIL=your-email@example.com
export JIRA_API_TOKEN=your-jira-api-token
export OPENAI_API_KEY=your-openai-api-key
```

### 3. Configure Cursor

1. Open Cursor
2. Go to Settings (⌘ + ,)
3. Search for "MCP"
4. Set MCP Config File to: `mcp-config.json`
5. Restart Cursor

## 📦 Available Scripts

### Docker Commands

| Command                    | Description                               |
| -------------------------- | ----------------------------------------- |
| `pnpm docker:build`        | Complete setup (build, test, create .env) |
| `pnpm docker:test`         | Test Docker container                     |
| `pnpm docker:status`       | Check Docker status and environment       |
| `pnpm docker:start`        | Run MCP server directly                   |
| `pnpm docker:run`          | Run container with current env vars       |
| `pnpm docker:load-env`     | Load environment variables from .env      |
| `pnpm docker:compose:up`   | Start with docker-compose                 |
| `pnpm docker:compose:down` | Stop docker-compose                       |
| `pnpm docker:compose:logs` | View docker-compose logs                  |
| `pnpm docker:dev`          | Development mode with rebuild             |
| `pnpm docker:clean`        | Remove Docker image                       |
| `pnpm docker:rebuild`      | Clean and rebuild                         |

### Development Commands

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `pnpm build`            | Build TypeScript to JavaScript |
| `pnpm dev`              | Start development server       |
| `pnpm start`            | Start production server        |
| `pnpm test:unit`        | Run unit tests                 |
| `pnpm test:integration` | Run integration tests          |
| `pnpm mcp:test`         | Test MCP server                |
| `pnpm mcp:start`        | Start MCP server locally       |

## 🛠️ Features

### Board Management

- **Get All Boards** - Retrieve all boards with filtering
- **Create Board** - Create scrum or kanban boards
- **Get Board Details** - Get specific board information
- **Delete Board** - Remove boards

### Issue Management

- **Get Board Backlog** - Retrieve backlog issues
- **Get Board Epics** - Get epics for a board
- **Get Board Sprints** - Retrieve sprints
- **Get Board Issues** - Get all issues on a board
- **Move Issues to Board** - Add issues to boards

### Backlog Management

- **Move to Backlog** - Move issues to backlog
- **Move to Board Backlog** - Move to specific board backlog

### Resources

- **Board Resource** - Detailed board information
- **Boards List Resource** - List of all boards

## 🔧 Configuration

### Environment Variables

| Variable           | Required | Description                  |
| ------------------ | -------- | ---------------------------- |
| `JIRA_BASE_URL`    | Yes      | Your Jira instance URL       |
| `JIRA_EMAIL`       | Yes      | Your Jira email              |
| `JIRA_API_TOKEN`   | Yes      | Your Jira API token          |
| `OPENAI_API_KEY`   | Yes      | OpenAI API key               |
| `JIRA_API_TIMEOUT` | No       | API timeout (default: 10000) |
| `JIRA_LOG_LEVEL`   | No       | Log level (default: info)    |

### Getting Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create a new token
3. Copy the generated token

## 🐳 Docker Usage

### Quick Start

```bash
# Setup everything (build, test, create .env)
pnpm docker:build

# Check status
pnpm docker:status

# Start server
pnpm docker:start
```

### Manual Docker Commands

```bash
# Build image
docker build -t jira-mcp-server:latest .

# Run container
docker run -i --rm --init \
  -e JIRA_BASE_URL=your-url \
  -e JIRA_EMAIL=your-email \
  -e JIRA_API_TOKEN=your-token \
  -e OPENAI_API_KEY=your-key \
  jira-mcp-server:latest
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs jira-mcp-server

# Stop services
docker-compose down
```

## 📁 Project Structure

```
mcp-jira-board/
├── src/
│   ├── mcps/           # MCP server implementation
│   ├── services/       # Jira API services
│   └── utils/          # Utilities and helpers
├── scripts/            # Build and utility scripts
├── integration-tests/  # Integration tests
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose config
├── mcp-config.json     # MCP configuration for Cursor
└── package.json        # Project dependencies
```

## 🧪 Testing

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# Test Docker container
pnpm docker:test

# Test MCP server
pnpm mcp:test
```

## 🔍 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**

   ```bash
   pnpm docker:status  # Check what's missing
   ```

2. **Docker Image Not Found**

   ```bash
   pnpm docker:build   # Rebuild the image
   ```

3. **MCP Connection Issues**
   - Restart Cursor
   - Check MCP configuration
   - Verify environment variables

4. **Jira API Errors**
   - Verify credentials
   - Check Jira instance URL
   - Ensure API token has correct permissions

### Debug Commands

```bash
# Check Docker status
pnpm docker:status

# Load environment variables
pnpm docker:load-env

# View container logs
pnpm docker:compose:logs

# Test container manually
pnpm docker:test

# Run server directly
pnpm docker:start
```

## 📚 Documentation

- [Docker Setup](DOCKER.md) - Detailed Docker documentation
- [MCP Server Guide](MCP-SERVER.md) - MCP server documentation
- [Integration Tests](integration-tests/README.md) - Testing guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
