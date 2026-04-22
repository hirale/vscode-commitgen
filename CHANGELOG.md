# Changelog

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
