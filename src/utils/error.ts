// Generic error utility for application-wide use
// Each error class extends Error and accepts a message and optional context object

/**
 * Base class for custom errors with optional context.
 */
export class UserInputError extends Error {
  context?: Record<string, unknown> | undefined;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'UserInputError';
    this.context = context;
    Error.captureStackTrace?.(this, UserInputError);
  }
}

/**
 * Error thrown when authentication fails.
 */
export class AuthenticationError extends Error {
  context?: Record<string, unknown> | undefined;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AuthenticationError';
    this.context = context;
    Error.captureStackTrace?.(this, AuthenticationError);
  }
}

/**
 * Error thrown when access is forbidden.
 */
export class ForbiddenError extends Error {
  context?: Record<string, unknown> | undefined;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ForbiddenError';
    this.context = context;
    Error.captureStackTrace?.(this, ForbiddenError);
  }
}

/**
 * Error thrown when a resource is not found.
 */
export class NotFoundError extends Error {
  context?: Record<string, unknown> | undefined;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'NotFoundError';
    this.context = context;
    Error.captureStackTrace?.(this, NotFoundError);
  }
}

/**
 * Error thrown for unexpected internal server errors.
 */
export class InternalServerError extends Error {
  context?: Record<string, unknown> | undefined;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'InternalServerError';
    this.context = context;
    Error.captureStackTrace?.(this, InternalServerError);
  }
}
