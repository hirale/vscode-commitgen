import * as assert from 'assert';
import { buildPrompt } from '../../prompt/PromptBuilder.js';
import type { ResolvedConfig } from '../../config/types.js';

const BASE_CONFIG: ResolvedConfig = {
  provider: 'openai-compatible',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  language: 'English',
  conventionalCommits: true,
  includeRecentCommits: false,
  recentCommitsCount: 5,
  maxDiffChars: 16000,
  temperature: 0.2,
  maxOutputTokens: 512,
  stream: false,
  systemPromptOverride: '',
  extraHeaders: {},
  requestTimeoutMs: 60000,
};

const SAMPLE_DIFF = `diff --git a/src/foo.ts b/src/foo.ts
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -1,3 +1,4 @@
+import { bar } from './bar';
 export function foo() {}
`;

suite('PromptBuilder', () => {
  test('includes system prompt with Conventional Commits instructions', () => {
    const { request } = buildPrompt({
      stagedDiff: SAMPLE_DIFF,
      filesChanged: ['src/foo.ts'],
      recentCommits: [],
      config: BASE_CONFIG,
    });
    const system = request.messages.find((m) => m.role === 'system');
    assert.ok(system?.content.includes('Conventional Commits'));
  });

  test('includes changed files in user message', () => {
    const { request } = buildPrompt({
      stagedDiff: SAMPLE_DIFF,
      filesChanged: ['src/foo.ts'],
      recentCommits: [],
      config: BASE_CONFIG,
    });
    const user = request.messages.find((m) => m.role === 'user');
    assert.ok(user?.content.includes('src/foo.ts'));
  });

  test('includes recent commits when provided', () => {
    const { request } = buildPrompt({
      stagedDiff: SAMPLE_DIFF,
      filesChanged: [],
      recentCommits: ['feat: add bar', 'fix: typo'],
      config: BASE_CONFIG,
    });
    const user = request.messages.find((m) => m.role === 'user');
    assert.ok(user?.content.includes('feat: add bar'));
  });

  test('uses language in system prompt', () => {
    const { request } = buildPrompt({
      stagedDiff: SAMPLE_DIFF,
      filesChanged: [],
      recentCommits: [],
      config: { ...BASE_CONFIG, language: 'Italian' },
    });
    const system = request.messages.find((m) => m.role === 'system');
    assert.ok(system?.content.includes('Italian'));
  });

  test('uses systemPromptOverride when set', () => {
    const { request } = buildPrompt({
      stagedDiff: SAMPLE_DIFF,
      filesChanged: [],
      recentCommits: [],
      config: { ...BASE_CONFIG, systemPromptOverride: 'MY_CUSTOM_PROMPT' },
    });
    const system = request.messages.find((m) => m.role === 'system');
    assert.strictEqual(system?.content, 'MY_CUSTOM_PROMPT');
  });

  test('marks wasTruncated when diff exceeds maxDiffChars', () => {
    const bigDiff = 'x'.repeat(5000);
    const { wasTruncated } = buildPrompt({
      stagedDiff: bigDiff,
      filesChanged: [],
      recentCommits: [],
      config: { ...BASE_CONFIG, maxDiffChars: 100 },
    });
    assert.strictEqual(wasTruncated, true);
  });

  test('passes correct model and generation params', () => {
    const { request } = buildPrompt({
      stagedDiff: SAMPLE_DIFF,
      filesChanged: [],
      recentCommits: [],
      config: { ...BASE_CONFIG, model: 'deepseek/deepseek-chat-v3.1:free', temperature: 0.5, maxOutputTokens: 256 },
    });
    assert.strictEqual(request.model, 'deepseek/deepseek-chat-v3.1:free');
    assert.strictEqual(request.temperature, 0.5);
    assert.strictEqual(request.maxOutputTokens, 256);
  });
});
