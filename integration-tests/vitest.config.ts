import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test files pattern
    include: ['**/*.integration.test.ts'],

    // Environment
    environment: 'node',

    // Timeout for integration tests (longer than unit tests)
    testTimeout: 30000,

    // Hook timeout
    hookTimeout: 30000,

    // Global setup (if needed)
    // globalSetup: './setup.ts',

    // Test reporters
    reporters: ['verbose', 'json', 'html'],

    // Output file for JSON reporter
    outputFile: {
      json: './integration-tests/output/integration-tests-results.json',
      html: './integration-tests/output/integration-tests-report.html',
    },

    // Coverage (optional)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.test.ts', 'integration-tests/**/*.test.ts'],
      reportsDirectory: './integration-tests/output/coverage',
    },

    // Log level
    // logLevel: 'info',

    // Pool options for better performance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
