import 'dotenv/config';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  apiTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  logLevel: string;
  logRequests: boolean;
  logResponses: boolean;
  rateLimitEnabled: boolean;
  rateLimitRequestsPerMinute: number;
  environment: 'cloud' | 'server';
}

interface Config {
  openaiApiKey: string;
  jira: JiraConfig;
  nodeEnv: string;
}

const validateJiraConfig = (): JiraConfig => {
  const required = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

  for (const varName of required) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate URL format
  try {
    new URL(process.env['JIRA_BASE_URL']!);
  } catch {
    throw new Error('Invalid JIRA_BASE_URL format. Must be a valid URL.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env['JIRA_EMAIL']!)) {
    throw new Error('Invalid JIRA_EMAIL format. Must be a valid email address.');
  }

  return {
    baseUrl: process.env['JIRA_BASE_URL']!,
    email: process.env['JIRA_EMAIL']!,
    apiToken: process.env['JIRA_API_TOKEN']!,
    apiTimeout: parseInt(process.env['JIRA_API_TIMEOUT'] || '10000'),
    retryAttempts: parseInt(process.env['JIRA_API_RETRY_ATTEMPTS'] || '3'),
    retryDelay: parseInt(process.env['JIRA_API_RETRY_DELAY'] || '1000'),
    logLevel: process.env['JIRA_LOG_LEVEL'] || 'info',
    logRequests: process.env['JIRA_LOG_REQUESTS'] === 'true',
    logResponses: process.env['JIRA_LOG_RESPONSES'] === 'true',
    rateLimitEnabled: process.env['JIRA_RATE_LIMIT_ENABLED'] === 'true',
    rateLimitRequestsPerMinute: parseInt(
      process.env['JIRA_RATE_LIMIT_REQUESTS_PER_MINUTE'] || '1000'
    ),
    environment: (process.env['JIRA_ENVIRONMENT'] as 'cloud' | 'server') || 'cloud',
  };
};

const getConfig = (): Config => {
  const openaiApiKey = process.env['OPENAI_API_KEY'];
  const nodeEnv = process.env['NODE_ENV'] || 'development';

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return {
    openaiApiKey,
    jira: validateJiraConfig(),
    nodeEnv,
  };
};

export const config = getConfig();
