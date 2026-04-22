import type { LlmMessage, LlmRequest } from '../providers/LlmProvider.js';
import type { ResolvedConfig } from '../config/types.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { truncateDiff } from './diffTruncator.js';

export interface PromptInput {
  stagedDiff: string;
  filesChanged: string[];
  recentCommits: string[];
  config: ResolvedConfig;
}

export interface BuiltPrompt {
  request: LlmRequest;
  wasTruncated: boolean;
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const { stagedDiff, filesChanged, recentCommits, config } = input;
  const { diff, truncated } = truncateDiff(stagedDiff, config.maxDiffChars);

  const systemContent = buildSystemPrompt({
    conventionalCommits: config.conventionalCommits,
    language: config.language,
    override: config.systemPromptOverride,
  });

  const parts: string[] = [];

  if (filesChanged.length > 0) {
    parts.push(`Changed files:\n${filesChanged.map((f) => `  - ${f}`).join('\n')}`);
  }

  if (recentCommits.length > 0) {
    parts.push(`Recent commits (for context):\n${recentCommits.map((c) => `  - ${c}`).join('\n')}`);
  }

  parts.push(`Staged diff:\n\`\`\`\n${diff}\n\`\`\``);

  const messages: LlmMessage[] = [
    { role: 'system', content: systemContent },
    { role: 'user', content: parts.join('\n\n') },
  ];

  return {
    request: {
      model: config.model,
      messages,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      stream: config.stream,
    },
    wasTruncated: truncated,
  };
}
