import { ErrorClassification, ErrorType } from './types';
import { sleep } from '../utils';

export function classifyError(err: any): ErrorClassification {
  if (!err) {
    return {
      errorType: 'UNKNOWN',
      retryable: false,
      shouldTripCircuit: false,
      message: 'Unknown error',
    };
  }

  const errMsg = String(err.message || err.description || err);
  const status = err.status || err.statusCode || err.code;

  // 1. Model Not Found / Invalid Model (404)
  if (
    status === 404 ||
    errMsg.includes('404') ||
    errMsg.includes('NOT_FOUND') ||
    errMsg.includes('does not exist') ||
    errMsg.includes('no longer available') ||
    errMsg.includes('invalid_model')
  ) {
    return {
      errorType: 'INVALID_MODEL_OR_404',
      statusCode: 404,
      retryable: false,
      shouldTripCircuit: false,
      message: 'Model not found or unavailable',
    };
  }

  // 2. Authentication & Authorization Errors (401, 403)
  if (
    status === 401 ||
    status === 403 ||
    errMsg.includes('401') ||
    errMsg.includes('403') ||
    errMsg.includes('API_KEY_INVALID') ||
    errMsg.includes('invalid_api_key') ||
    errMsg.includes('Unauthorized') ||
    errMsg.includes('Permission denied')
  ) {
    return {
      errorType: 'AUTH_ERROR',
      statusCode: status || 401,
      retryable: false,
      shouldTripCircuit: false,
      message: 'Authentication or API key error',
    };
  }

  // 3. Bad Request / Invalid Arguments (400)
  if (
    status === 400 ||
    errMsg.includes('400') ||
    errMsg.includes('INVALID_ARGUMENT') ||
    errMsg.includes('invalid_request_error')
  ) {
    return {
      errorType: 'INVALID_REQUEST',
      statusCode: 400,
      retryable: false,
      shouldTripCircuit: false,
      message: 'Invalid request payload or configuration',
    };
  }

  // 4. Quota Exceeded / Billing Failures (429 Quota)
  if (
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('insufficient_quota') ||
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('billing') ||
    errMsg.includes('check your plan')
  ) {
    return {
      errorType: 'QUOTA_EXCEEDED',
      statusCode: 429,
      retryable: false,
      shouldTripCircuit: true, // Trip circuit breaker immediately for quota/billing failures
      message: 'Account quota exceeded or billing issue',
    };
  }

  // 5. Rate Limit (429 Rate Limit)
  if (status === 429 || errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('Rate limit')) {
    return {
      errorType: 'RATE_LIMIT',
      statusCode: 429,
      retryable: true,
      shouldTripCircuit: false,
      message: 'Rate limit hit',
    };
  }

  // 6. Timeout
  if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT') || errMsg.includes('AbortError') || err.name === 'AbortError') {
    return {
      errorType: 'TIMEOUT',
      statusCode: 408,
      retryable: true,
      shouldTripCircuit: false,
      message: 'Request timed out',
    };
  }

  // 7. Transient Server Errors (500, 502, 503, 504)
  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    errMsg.includes('500') ||
    errMsg.includes('502') ||
    errMsg.includes('503') ||
    errMsg.includes('504') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('high demand')
  ) {
    return {
      errorType: 'SERVER_ERROR',
      statusCode: status || 503,
      retryable: true,
      shouldTripCircuit: false,
      message: 'Transient server error',
    };
  }

  return {
    errorType: 'UNKNOWN',
    statusCode: status || 500,
    retryable: false,
    shouldTripCircuit: false,
    message: errMsg,
  };
}

export function calculateBackoff(attempt: number): number {
  const baseDelay = 500; // 500ms
  const exponential = Math.pow(2, attempt - 1) * baseDelay; // 500ms, 1000ms, 2000ms
  const jitter = Math.floor(Math.random() * 300); // 0-300ms random jitter
  const total = exponential + jitter;
  return Math.min(total, 3000); // Cap at 3 seconds
}

export async function withTimeout<T>(
  promiseFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const result = await promiseFn(controller.signal);
    clearTimeout(timer);
    return result;
  } catch (err: any) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutError.name = 'AbortError';
      throw timeoutError;
    }
    throw err;
  }
}
