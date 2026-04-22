export function buildSystemPrompt(opts: {
  conventionalCommits: boolean;
  language: string;
  override?: string;
}): string {
  if (opts.override?.trim()) return opts.override.trim();

  const format = opts.conventionalCommits
    ? `Follow the Conventional Commits 1.0.0 specification (https://www.conventionalcommits.org):

Structure:
  <type>[(<scope>)][!]: <description>

  [optional body]

  [optional footer(s)]

Rules:
  - type: feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert
  - scope: optional noun describing the affected area, e.g. feat(parser):
  - !: append to flag a breaking change, e.g. feat!: or feat(api)!:
  - description: imperative mood, no period at end; subject line max 72 chars
  - body: optional context separated by a blank line, wrapped at 72 chars
  - Breaking changes: include a BREAKING CHANGE: footer when explanation is needed
      BREAKING CHANGE: <what changed and why>
  - Other footers follow git trailer format, e.g. Refs: #123, Co-authored-by: …
  - Output ONLY the commit message — no explanation, no markdown code fences.`
    : `Write a concise, clear commit message in imperative mood.
  - Max 72 chars for the subject line
  - Output ONLY the commit message, no explanation, no markdown code blocks.`;

  return `You are an expert software engineer writing a git commit message.
${format}
Respond in ${opts.language}.`;
}
