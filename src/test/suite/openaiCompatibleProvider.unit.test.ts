import * as assert from 'assert';
import { OpenAICompatibleProvider } from '../../providers/openaiCompatible/OpenAICompatibleProvider.js';
import { LlmError } from '../../providers/LlmProvider.js';

// Minimal CancellationToken stub
const neverToken = {
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => undefined }),
};

const BASE_CTX = {
  apiKey: 'test-key',
  baseUrl: 'https://api.example.com/v1',
  extraHeaders: {},
  requestTimeoutMs: 5000,
};

const BASE_REQUEST = {
  model: 'test-model',
  messages: [{ role: 'user' as const, content: 'hello' }],
  stream: false,
};

function makeFetch(status: number, body: unknown) {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
}

suite('OpenAICompatibleProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  setup(() => {
    originalFetch = globalThis.fetch;
  });

  teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test('non-streaming: yields single chunk with full content', async () => {
    globalThis.fetch = makeFetch(200, {
      choices: [{ message: { content: 'feat: hello world' } }],
    }) as typeof fetch;

    const provider = new OpenAICompatibleProvider(BASE_CTX);
    const chunks = [];
    for await (const chunk of provider.generate(BASE_REQUEST, neverToken as never)) {
      chunks.push(chunk);
    }
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0].delta, 'feat: hello world');
    assert.strictEqual(chunks[0].done, true);
  });

  test('401 throws LlmError with code=auth', async () => {
    globalThis.fetch = makeFetch(401, { error: { message: 'Invalid key' } }) as typeof fetch;

    const provider = new OpenAICompatibleProvider(BASE_CTX);
    try {
      for await (const _ of provider.generate(BASE_REQUEST, neverToken as never)) {
        // should not reach here
      }
      assert.fail('Expected LlmError');
    } catch (err) {
      assert.ok(err instanceof LlmError);
      assert.strictEqual(err.code, 'auth');
    }
  });

  test('429 throws LlmError with code=rate_limit', async () => {
    globalThis.fetch = makeFetch(429, { error: { message: 'Too Many Requests' } }) as typeof fetch;

    const provider = new OpenAICompatibleProvider(BASE_CTX);
    try {
      for await (const _ of provider.generate(BASE_REQUEST, neverToken as never)) {
        // should not reach here
      }
      assert.fail('Expected LlmError');
    } catch (err) {
      assert.ok(err instanceof LlmError);
      assert.strictEqual(err.code, 'rate_limit');
    }
  });

  test('does not send Authorization header when apiKey is absent', async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
      capturedHeaders = Object.fromEntries(
        Object.entries(init?.headers as Record<string, string> ?? {}),
      );
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 });
    }) as typeof fetch;

    const provider = new OpenAICompatibleProvider({ ...BASE_CTX, apiKey: undefined });
    for await (const _ of provider.generate(BASE_REQUEST, neverToken as never)) { /* noop */ }

    assert.ok(!('Authorization' in capturedHeaders));
  });

  test('retries once on 429 with Retry-After: 0 and succeeds', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      if (calls === 1) {
        return new Response('{}', { status: 429, headers: { 'Retry-After': '0' } });
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: 'feat: retry ok' } }] }), { status: 200 });
    }) as typeof fetch;

    const provider = new OpenAICompatibleProvider(BASE_CTX);
    const chunks = [];
    for await (const chunk of provider.generate(BASE_REQUEST, neverToken as never)) {
      chunks.push(chunk);
    }
    assert.strictEqual(calls, 2);
    assert.strictEqual(chunks[0].delta, 'feat: retry ok');
  });

  test('retries once on 500 and fails with code=server when both attempts fail', async () => {
    globalThis.fetch = makeFetch(500, { error: { message: 'Internal Server Error' } }) as typeof fetch;

    const provider = new OpenAICompatibleProvider(BASE_CTX);
    try {
      for await (const _ of provider.generate(BASE_REQUEST, neverToken as never)) { /* noop */ }
      assert.fail('Expected LlmError');
    } catch (err) {
      assert.ok(err instanceof LlmError);
      assert.strictEqual(err.code, 'server');
    }
  });

  test('does not retry on 401 auth errors', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response('{}', { status: 401 });
    }) as typeof fetch;

    const provider = new OpenAICompatibleProvider(BASE_CTX);
    try {
      for await (const _ of provider.generate(BASE_REQUEST, neverToken as never)) { /* noop */ }
      assert.fail('Expected LlmError');
    } catch (err) {
      assert.ok(err instanceof LlmError);
      assert.strictEqual(err.code, 'auth');
    }
    assert.strictEqual(calls, 1);
  });
});
