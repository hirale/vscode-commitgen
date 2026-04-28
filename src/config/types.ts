export interface ResolvedConfig {
  provider: string;
  baseUrl: string;
  model: string;
  language: string;
  conventionalCommits: boolean;
  includeRecentCommits: boolean;
  recentCommitsCount: number;
  maxDiffChars: number;
  temperature: number;
  maxOutputTokens: number;
  stream: boolean;
  systemPromptOverride: string;
  extraHeaders: Record<string, string>;
  requestTimeoutMs: number;
  promptForCloseRef: boolean;
}
