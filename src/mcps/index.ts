import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from '../utils/log';

import z from 'zod';

const log = new Logger('MCP Server');

// Create an MCP server
const server = new McpServer({
  name: 'jira-mcp-server',
  version: '1.0.0',
});

// Add an addition tool
server.registerTool(
  'add',
  {
    title: 'Addition Tool',
    description: 'Add two numbers',
    // @ts-ignore
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => {
    log.info(`🔧 Tool 'add' called with a=${a}, b=${b}`);
    const result = a + b;
    log.info(`✅ Addition result: ${result}`);
    return {
      content: [{ type: 'text', text: String(result) }],
    };
  }
);

// Add a dynamic greeting resource
server.registerResource(
  'greeting',
  new ResourceTemplate('greeting://{name}', { list: undefined }),
  {
    title: 'Greeting Resource', // Display name for UI
    description: 'Dynamic greeting generator',
  },
  async (uri, { name }) => {
    log.info(`📄 Resource 'greeting' requested for name: ${name}`);
    const greeting = `Hello, ${name}!`;
    log.info(`✅ Generated greeting: ${greeting}`);
    return {
      contents: [
        {
          uri: uri.href,
          text: greeting,
        },
      ],
    };
  }
);

export const startServer = async () => {
  log.info('🔌 Starting MCP server with stdio transport...');

  try {
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log.success('✅ MCP server connected successfully');
  } catch (error) {
    log.error(`❌ Failed to start MCP server: ${error}`);
    throw error;
  }
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
