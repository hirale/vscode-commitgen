import { LlmError } from '../LlmProvider.js';

export function mapHttpError(status: number, body: string, baseUrl: string): LlmError {
  switch (status) {
    case 401:
    case 403:
      return new LlmError(
        `Authentication failed for ${baseUrl} (HTTP ${status}). Check your API key.`,
        'auth',
        status,
      );
    case 429:
      return new LlmError(
        `Rate limited by ${baseUrl} (HTTP 429). Try a different model or wait before retrying.`,
        'rate_limit',
        status,
      );
    case 400:
      return new LlmError(
        `Bad request to ${baseUrl} (HTTP 400): ${body.slice(0, 200)}`,
        'bad_request',
        status,
      );
    default:
      return new LlmError(
        `${baseUrl} returned HTTP ${status}: ${body.slice(0, 200)}`,
        status >= 500 ? 'server' : 'unknown',
        status,
      );
  }
}
