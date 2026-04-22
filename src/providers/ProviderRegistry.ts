import type { LlmProvider } from './LlmProvider.js';

export interface ProviderConstructionContext {
  apiKey: string | undefined;
  baseUrl: string;
  extraHeaders: Record<string, string>;
  requestTimeoutMs: number;
}

export type ProviderFactory = (ctx: ProviderConstructionContext) => LlmProvider;

export class ProviderRegistry {
  private readonly factories = new Map<string, ProviderFactory>();

  register(id: string, factory: ProviderFactory): void {
    this.factories.set(id, factory);
  }

  create(id: string, ctx: ProviderConstructionContext): LlmProvider {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Unknown LLM provider: "${id}". Registered: ${[...this.factories.keys()].join(', ')}`);
    }
    return factory(ctx);
  }

  list(): string[] {
    return [...this.factories.keys()];
  }
}
