import { LlmError } from '../LlmProvider.js';

function parseRetryAfter(header: string | null | undefined): number | undefined {
  if (!header) return undefined;
  const secs = Number(header.trim());
  if (!isNaN(secs) && secs >= 0) return secs * 1000;
  const date = new Date(header);
  const ms = date.getTime() - Date.now();
  return ms > 0 ? ms : undefined;
}

export function mapHttpError(
  status: number,
  body: string,
  baseUrl: string,
  retryAfterHeader?: string | null,
): LlmError {
  switch (status) {
    case 401:
    case 403:
      return new LlmError(
        `Authentication failed for ${baseUrl} (HTTP ${status}). Check your API key.`,
        'auth',
        status,
      );
    case 429: {
      const retryAfterMs = parseRetryAfter(retryAfterHeader);
      const hint = retryAfterMs
        ? `Retrying in ${Math.ceil(retryAfterMs / 1000)}s…`
        : 'Try again later.';
      return new LlmError(
        `Rate limited by ${baseUrl} (HTTP 429). ${hint}`,
        'rate_limit',
        status,
        retryAfterMs,
      );
    }
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
