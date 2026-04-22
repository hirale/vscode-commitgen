import type { LlmChunk } from '../LlmProvider.js';

export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<LlmChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          yield { delta: '', done: true };
          return;
        }

        let parsed: OpenAIChatChunk;
        try {
          parsed = JSON.parse(data) as OpenAIChatChunk;
        } catch {
          continue;
        }

        const delta = parsed.choices?.[0]?.delta?.content ?? '';
        const finishReason = parsed.choices?.[0]?.finish_reason;
        const usage = parsed.usage
          ? { promptTokens: parsed.usage.prompt_tokens, completionTokens: parsed.usage.completion_tokens }
          : undefined;

        if (delta) {
          yield { delta, done: false };
        }
        if (finishReason) {
          yield { delta: '', done: true, usage };
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { delta: '', done: true };
}

interface OpenAIChatChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}
