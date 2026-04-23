import type * as vscode from 'vscode';
import type { LlmChunk, LlmProvider, LlmRequest, ProviderCapabilities } from '../LlmProvider.js';
import { LlmError } from '../LlmProvider.js';
import type { ProviderConstructionContext } from '../ProviderRegistry.js';
import { tokenToAbortController } from '../../util/cancellation.js';
import { buildAuthHeaders } from '../../util/httpHeaders.js';
import { log } from '../../util/logger.js';
import { mapHttpError } from './errors.js';
import { parseSseStream } from './sseParser.js';

const RETRY_BACKOFF_MS = 1000;

export class OpenAICompatibleProvider implements LlmProvider {
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    id: 'openai-compatible',
    displayName: 'OpenAI-Compatible',
  };

  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly extraHeaders: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(ctx: ProviderConstructionContext) {
    this.baseUrl = ctx.baseUrl;
    this.apiKey = ctx.apiKey;
    this.extraHeaders = ctx.extraHeaders;
    this.timeoutMs = ctx.requestTimeoutMs;
  }

  async *generate(request: LlmRequest, token: vscode.CancellationToken): AsyncIterable<LlmChunk> {
    const startTime = Date.now();
    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const elapsed = Date.now() - startTime;
      const remaining = this.timeoutMs - elapsed;
      if (remaining <= 0) throw new LlmError('Request timed out', 'aborted');

      const { controller, dispose } = tokenToAbortController(token);
      const timer = setTimeout(() => controller.abort(new Error('Request timed out')), remaining);

      try {
        yield* this._fetchAndStream(request, controller);
        return;
      } catch (err) {
        if (!(err instanceof LlmError)) throw err;
        if (err.code === 'aborted') throw err;

        const retryable = err.code === 'rate_limit' || err.code === 'server';
        if (!retryable || attempt === maxAttempts - 1) throw err;

        const waitMs = err.retryAfterMs ?? RETRY_BACKOFF_MS;
        log(`HTTP ${err.statusCode} from ${this.baseUrl} — retrying in ${Math.ceil(waitMs / 1000)}s…`);
        await delayWithCancellation(waitMs, token);
      } finally {
        clearTimeout(timer);
        dispose();
      }
    }
  }

  private async *_fetchAndStream(request: LlmRequest, controller: AbortController): AsyncGenerator<LlmChunk> {
    const headers = {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(this.extraHeaders, this.apiKey),
    };

    const shouldStream = request.stream !== false;
    const body = JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxOutputTokens,
      stream: shouldStream,
    });

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) throw new LlmError('Request aborted', 'aborted');
      throw new LlmError(`Network error: ${String(err)}`, 'network');
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw mapHttpError(response.status, errorBody, this.baseUrl, response.headers.get('Retry-After'));
    }

    if (shouldStream && response.body) {
      yield* parseSseStream(response.body, controller.signal);
    } else {
      const json = await response.json() as OpenAIChatResponse;
      const content = json.choices?.[0]?.message?.content ?? '';
      const usage = json.usage
        ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens }
        : undefined;
      yield { delta: content, done: true, usage };
    }
  }
}

function delayWithCancellation(ms: number, token: vscode.CancellationToken): Promise<void> {
  return new Promise((resolve, reject) => {
    if (token.isCancellationRequested) {
      reject(new LlmError('Request aborted', 'aborted'));
      return;
    }
    const id = setTimeout(() => {
      d.dispose();
      resolve();
    }, ms);
    const d = token.onCancellationRequested(() => {
      clearTimeout(id);
      d.dispose();
      reject(new LlmError('Request aborted', 'aborted'));
    });
  });
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function createOpenAICompatibleProvider(ctx: ProviderConstructionContext): LlmProvider {
  return new OpenAICompatibleProvider(ctx);
}
