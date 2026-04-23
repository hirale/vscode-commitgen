# Changelog

## [0.1.1] — 2026-04-23

### Fixed
- Empty repository no longer throws when `includeRecentCommits` is enabled — `git log` failure is caught and treated as no history.
- Workspace-level language (and all other settings) now correctly override WSL/user settings; all settings marked as `resource` scope and config is resolved against the workspace folder URI.

## [0.1.0] — Unreleased

### Added
- Generate commit messages from staged diffs via any OpenAI-compatible endpoint.
- Streaming into the Source Control input box.
- `$(sparkle)` button on the SCM title bar.
- `commitgen.setApiKey` command — stores key in VS Code SecretStorage (OS keychain).
- `commitgen.selectModel` command — browse `/models` endpoint or enter manually.
- Conventional Commits format by default, configurable system prompt override.
- Diff truncation guard with per-file fair-share strategy.
- OpenRouter, Ollama, LM Studio, LM Studio, vLLM, Together, and Groq support out of the box.
