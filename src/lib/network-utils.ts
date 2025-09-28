/**
 * Network utility functions for handling retries and network errors
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  // First check if it's a NetworkError with explicit retryable flag
  if (error instanceof NetworkError) {
    return error.retryable;
  }

  // Network-related errors that should be retried
  const retryableErrors = [
    'ERR_NETWORK_CHANGED',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_ACCESS_DENIED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_NAME_NOT_RESOLVED',
    'ERR_TIMED_OUT',
    'ERR_FAILED',
    'TypeError', // Often network-related in fetch
  ];

  const errorMessage = error?.message || '';
  const errorName = error?.name || '';
  
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError) || 
    errorName.includes(retryableError)
  );
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, backoffFactor: number): number {
  const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      // Only log retry attempts for non-404 errors to reduce console noise
      if (error.status !== 404) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      }
      await sleep(delay);
    }
  }

  throw new NetworkError(
    `Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    undefined,
    lastError?.code,
    false
  );
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    // Treat HTTP errors as non-retryable by default
    if (!response.ok) {
      const error = new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        undefined,
        response.status >= 500 // Only retry server errors (5xx)
      );
      throw error;
    }
    
    return response;
  }, retryOptions);
}

/**
 * Silent fetch for expected 404s (like new chats)
 */
export async function fetchSilent(
  url: string,
  options: RequestInit = {}
): Promise<Response | null> {
  try {
    const response = await fetch(url, options);
    
    // Return null for 404s instead of throwing
    if (response.status === 404) {
      return null;
    }
    
    // Throw for other errors
    if (!response.ok) {
      const error = new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        undefined,
        response.status >= 500
      );
      throw error;
    }
    
    return response;
  } catch (error) {
    // Re-throw non-404 errors
    throw error;
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    if (error.code === 'ERR_NETWORK_CHANGED') {
      return 'Network connection changed. Please check your internet connection and try again.';
    }
    if (error.code === 'ERR_INTERNET_DISCONNECTED') {
      return 'No internet connection. Please check your network and try again.';
    }
    if (error.status && error.status >= 500) {
      return 'Server error. Please try again in a moment.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
  }

  const message = error?.message || 'An unexpected error occurred';
  
  if (message.includes('ERR_NETWORK_CHANGED')) {
    return 'Network connection changed. Please check your internet connection and try again.';
  }
  
  if (message.includes('ERR_INTERNET_DISCONNECTED')) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (message.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  return message;
}
