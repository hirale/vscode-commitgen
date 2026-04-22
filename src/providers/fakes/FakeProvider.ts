import type * as vscode from 'vscode';
import type { LlmChunk, LlmProvider, LlmRequest, ProviderCapabilities } from '../LlmProvider.js';

export class FakeProvider implements LlmProvider {
  readonly capabilities: ProviderCapabilities = {
    streaming: false,
    id: 'fake',
    displayName: 'Fake (test)',
  };

  constructor(private readonly response: string = 'feat: test commit message') {}

  async *generate(_request: LlmRequest, _token: vscode.CancellationToken): AsyncIterable<LlmChunk> {
    yield { delta: this.response, done: true };
  }
}
