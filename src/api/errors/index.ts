export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', details?: Record<string, unknown>) {
    super('AUTHENTICATION_ERROR', 401, message, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied', details?: Record<string, unknown>) {
    super('AUTHORIZATION_ERROR', 403, message, details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', 400, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT_ERROR', 409, message, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 429, 'Too many requests', { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'Request timeout') {
    super('TIMEOUT_ERROR', 504, message);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network error', details?: Record<string, unknown>) {
    super('NETWORK_ERROR', 0, message, details);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ProcessingError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('PROCESSING_ERROR', 500, message, details);
    Object.setPrototypeOf(this, ProcessingError.prototype);
  }
}

export const errorMessages: Record<string, string> = {
  AUTHENTICATION_ERROR: 'Please log in again',
  AUTHORIZATION_ERROR: 'You do not have permission for this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Please check your input',
  CONFLICT_ERROR: 'This resource already exists',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  TIMEOUT_ERROR: 'Request took too long. Please try again',
  NETWORK_ERROR: 'Network connection failed',
  PROCESSING_ERROR: 'Processing failed. Please try again',
};

export function getUserFriendlyMessage(error: ApiError | Error): string {
  if (error instanceof ApiError) {
    return errorMessages[error.code] || error.message;
  }
  return 'An unexpected error occurred';
}
