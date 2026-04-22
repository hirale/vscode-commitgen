export function buildSystemPrompt(opts: {
  conventionalCommits: boolean;
  language: string;
  override?: string;
}): string {
  if (opts.override?.trim()) return opts.override.trim();

  const format = opts.conventionalCommits
    ? `Follow the Conventional Commits specification (https://www.conventionalcommits.org):
  - Format: <type>(<optional scope>): <subject>
  - Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert
  - Subject: imperative mood, lowercase, no period at end, max 72 chars
  - Optional body: separated by blank line, wrap at 72 chars
  - Output ONLY the commit message, no explanation, no markdown code blocks.`
    : `Write a concise, clear commit message in imperative mood.
  - Max 72 chars for the subject line
  - Output ONLY the commit message, no explanation, no markdown code blocks.`;

  return `You are an expert software engineer writing a git commit message.
${format}
Respond in ${opts.language}.`;
}
