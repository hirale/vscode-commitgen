import type * as vscode from 'vscode';
import type { LlmChunk, LlmProvider, LlmRequest, ProviderCapabilities } from '../LlmProvider.js';
import { LlmError } from '../LlmProvider.js';
import type { ProviderConstructionContext } from '../ProviderRegistry.js';
import { tokenToAbortController } from '../../util/cancellation.js';
import { buildAuthHeaders } from '../../util/httpHeaders.js';
import { mapHttpError } from './errors.js';
import { parseSseStream } from './sseParser.js';

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
    const { controller, dispose } = tokenToAbortController(token);
    const timer = setTimeout(() => controller.abort(new Error('Request timed out')), this.timeoutMs);

    try {
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
        throw mapHttpError(response.status, errorBody, this.baseUrl);
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
    } finally {
      clearTimeout(timer);
      dispose();
    }
  }
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function createOpenAICompatibleProvider(ctx: ProviderConstructionContext): LlmProvider {
  return new OpenAICompatibleProvider(ctx);
}
