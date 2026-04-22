import type * as vscode from 'vscode';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  stream?: boolean;
}

export interface LlmChunk {
  delta: string;
  done: boolean;
  usage?: { promptTokens?: number; completionTokens?: number };
}

export interface ProviderCapabilities {
  readonly streaming: boolean;
  readonly id: string;
  readonly displayName: string;
}

export interface LlmProvider {
  readonly capabilities: ProviderCapabilities;
  /**
   * Stream the completion as an async iterable of chunks.
   * Non-streaming providers yield exactly one chunk with done=true.
   * Must honour token.onCancellationRequested and abort the HTTP request.
   */
  generate(request: LlmRequest, token: vscode.CancellationToken): AsyncIterable<LlmChunk>;
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly code: 'auth' | 'rate_limit' | 'server' | 'bad_request' | 'network' | 'aborted' | 'unknown',
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}
