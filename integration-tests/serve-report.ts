#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }

    // Wait 500ms before next attempt
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

async function serveReport(): Promise<void> {
  const outputDir = resolve(__dirname, 'output');

  // Check if output directory exists
  if (!existsSync(outputDir)) {
    console.log(chalk.red('❌ Output directory not found!'));
    console.log(chalk.yellow('Run: pnpm test:integration'));
    process.exit(1);
  }

  // Check if HTML report exists
  const htmlFile = resolve(outputDir, 'integration-tests-report.html');
  if (!existsSync(htmlFile)) {
    console.log(chalk.red('❌ HTML report not found!'));
    console.log(chalk.yellow('Run: pnpm test:integration'));
    process.exit(1);
  }

  console.log(chalk.blue('🚀 Starting Vite Preview Server...'));

  // Start vite preview
  const viteProcess = spawn(
    'npx',
    ['vite', 'preview', '--host', '--outDir', 'integration-tests/output'],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    }
  );

  let serverUrl = 'http://localhost:4173/';

  viteProcess.stdout?.on('data', data => {
    const text = data.toString();

    // Extract server URL from output
    const urlMatch = text.match(/Local:\s+(http:\/\/localhost:\d+)/);
    if (urlMatch) {
      serverUrl = urlMatch[1] + '/';
    }

    // Show server output
    process.stdout.write(text);
  });

  viteProcess.stderr?.on('data', data => {
    const text = data.toString();
    process.stderr.write(chalk.yellow(text));
  });

  // Wait for server to be ready
  console.log(chalk.blue('⏳ Waiting for server to be ready...'));

  const serverReady = await waitForServer(serverUrl);

  if (serverReady) {
    console.log(chalk.green(`✅ Server ready at ${serverUrl}`));
    console.log(chalk.blue('🌐 Opening browser...'));

    // Open browser
    const openProcess = spawn('open', [serverUrl], {
      stdio: 'inherit',
      shell: true,
    });

    openProcess.on('close', code => {
      if (code === 0) {
        console.log(chalk.green('✅ Browser opened successfully!'));
      } else {
        console.log(chalk.yellow('⚠️  Could not open browser automatically'));
        console.log(chalk.blue(`Please open manually: ${serverUrl}`));
      }
    });

    console.log(chalk.blue('📋 Server is running. Press Ctrl+C to stop.'));
  } else {
    console.log(chalk.red('❌ Server failed to start'));
    viteProcess.kill();
    process.exit(1);
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Stopping server...'));
    viteProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Stopping server...'));
    viteProcess.kill();
    process.exit(0);
  });
}

serveReport().catch(error => {
  console.error(chalk.red('❌ Error:'), error);
  process.exit(1);
});
