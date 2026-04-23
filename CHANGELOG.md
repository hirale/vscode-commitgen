# Changelog

## [0.2.0] — 2026-04-23

### Added
- `commitgen.showLog` command — reveals the Output channel for diagnostics.
- Unstaged-diff fallback: when nothing is staged, the info prompt now offers "Generate from unstaged changes" as an action.
- Retry on HTTP 429 (honours `Retry-After` header) and 5xx (1 s backoff, one retry).
- Usage token counts logged to the Output channel when the provider returns them.

### Fixed
- `selectModel` now writes to Workspace scope if a workspace value already exists, or prompts for scope on first save — previously always wrote to Global.
- File-boundary detection in the diff truncator no longer mis-splits on `--- ` context lines (e.g. horizontal rules in Markdown diffs).
- Editing the SCM input box mid-stream now cancels the underlying HTTP request, not just the write loop.
- Friendly error message when `git` is not on PATH (`ENOENT` → install-Git prompt).
- Model preludes stripped before writing to the input box (code fences, "Here is…" openers).
- Integration test used the wrong extension publisher ID (`your-publisher.commit-message-generator` → `Hirale.hirale-commitgen`).

## [0.1.1] — 2026-04-23

### Fixed
- Empty repository no longer throws when `includeRecentCommits` is enabled — `git log` failure is caught and treated as no history.
- Workspace-level language (and all other settings) now correctly override WSL/user settings; all settings marked as `resource` scope and config is resolved against the workspace folder URI.

## [0.1.0] — 2026-04-23

### Added
- Generate commit messages from staged diffs via any OpenAI-compatible endpoint.
- Streaming into the Source Control input box.
- `$(sparkle)` button on the SCM title bar.
- `commitgen.setApiKey` command — stores key in VS Code SecretStorage (OS keychain).
- `commitgen.selectModel` command — browse `/models` endpoint or enter manually.
- Conventional Commits format by default, configurable system prompt override.
- Diff truncation guard with per-file fair-share strategy.
- OpenRouter, Ollama, LM Studio, vLLM, Together, and Groq support out of the box.
