# MCP Jira Board

A minimalist TypeScript project with Prettier, ESLint, and pnpm.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm build
```

3. Run the project:
```bash
pnpm start
```

## Development

- **Watch mode**: `pnpm dev`
- **Lint**: `pnpm lint`
- **Lint with auto-fix**: `pnpm lint:fix`
- **Format code**: `pnpm format`
- **Check formatting**: `pnpm format:check`
- **Type check**: `pnpm type-check`
- **Clean build**: `pnpm clean`

## Project Structure

```
├── src/
│   └── index.ts          # Main entry point
├── dist/                 # Compiled output (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## Features

- ✅ TypeScript with strict configuration
- ✅ ESLint with TypeScript support
- ✅ Prettier for code formatting
- ✅ pnpm for package management
- ✅ Source maps and declaration files
- ✅ Modern ES2022 target 