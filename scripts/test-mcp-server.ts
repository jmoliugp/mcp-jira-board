#!/usr/bin/env tsx

import { startServer } from '../src/mcps/index.js';
import { Logger } from '../src/utils/log.js';

const log = new Logger('MCP Test');

async function testMcpServer() {
  log.info('🧪 Testing MCP server...');

  try {
    // Start the server
    await startServer();
    log.success('✅ MCP server started successfully');

    // Keep the server running for a few seconds to test
    log.info('⏳ Server is running. Press Ctrl+C to stop...');

    // Keep the process alive
    process.on('SIGINT', () => {
      log.info('🛑 Received SIGINT, shutting down...');
      process.exit(0);
    });
  } catch (error) {
    log.error(`❌ Failed to start MCP server: ${error}`);
    process.exit(1);
  }
}

// Run the test
testMcpServer().catch(error => {
  log.error(`💥 Fatal error in test: ${error}`);
  process.exit(1);
});
