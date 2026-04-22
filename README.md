# Commit Message Generator

Generate [Conventional Commits](https://www.conventionalcommits.org) messages from your staged diff using any OpenAI-compatible LLM endpoint.

Works with **OpenAI**, **OpenRouter** (free tier), **Ollama**, **LM Studio**, **Groq**, **Together**, **vLLM**, and more.

---

## Features

- **Sparkle button** on the Source Control title bar — one click to generate.
- **Streams** tokens directly into the commit input box as they arrive.
- **Any OpenAI-compatible endpoint** — point at OpenRouter for free cloud models or Ollama for fully local, air-gapped generation.
- **Conventional Commits** format enforced by default (configurable).
- **API keys stored securely** in VS Code SecretStorage (OS keychain) — never in `settings.json`.
- **Diff truncation** with per-file fair-share budget — large repos don't silently produce bad prompts.

---

## Quick Start

1. Install the extension.
2. Open a git repository and stage some changes.
3. Run **Commit Gen: Set API Key** from the Command Palette (or skip for Ollama / local endpoints).
4. Click the ✨ button in the Source Control title bar (or run **Commit Gen: Generate Commit Message**).

---

## Provider Recipes

### OpenRouter (free tier)

```json
"commitgen.baseUrl": "https://openrouter.ai/api/v1",
"commitgen.model":   "deepseek/deepseek-chat-v3.1:free",
"commitgen.extraHeaders": {
  "HTTP-Referer": "https://github.com/hirale/vscode-commitgen",
  "X-Title":      "Commit Message Generator"
}
```

Run **Commit Gen: Set API Key** and paste your OpenRouter API key (free account at openrouter.ai).

### Ollama (local, no API key)

```json
"commitgen.baseUrl": "http://localhost:11434/v1",
"commitgen.model":   "qwen2.5-coder:7b"
```

No API key needed. `ollama pull qwen2.5-coder:7b` first.

### LM Studio (local, no API key)

```json
"commitgen.baseUrl": "http://localhost:1234/v1",
"commitgen.model":   "your-loaded-model-id"
```

### OpenAI

```json
"commitgen.baseUrl": "https://api.openai.com/v1",
"commitgen.model":   "gpt-4o-mini"
```

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `commitgen.baseUrl` | `https://api.openai.com/v1` | OpenAI-compatible endpoint base URL |
| `commitgen.model` | `gpt-4o-mini` | Model ID |
| `commitgen.language` | `English` | Output language |
| `commitgen.conventionalCommits` | `true` | Enforce Conventional Commits format |
| `commitgen.includeRecentCommits` | `false` | Pass recent commit subjects as context |
| `commitgen.recentCommitsCount` | `5` | How many recent commits to include |
| `commitgen.maxDiffChars` | `16000` | Max diff chars to send (truncates beyond) |
| `commitgen.temperature` | `0.2` | Sampling temperature |
| `commitgen.maxOutputTokens` | `512` | Max tokens in generated message |
| `commitgen.stream` | `true` | Stream tokens into input box |
| `commitgen.systemPromptOverride` | `""` | Custom system prompt (overrides built-in) |
| `commitgen.extraHeaders` | `{}` | Extra HTTP headers (e.g., OpenRouter attribution) |
| `commitgen.requestTimeoutMs` | `60000` | Request timeout in ms |

---

## Commands

| Command | Description |
|---|---|
| `Commit Gen: Generate Commit Message` | Generate from staged diff |
| `Commit Gen: Set API Key` | Store API key in OS keychain |
| `Commit Gen: Select Model` | Browse or enter model ID |

---

## Privacy

**Your staged diff is sent to the configured endpoint.** For proprietary or sensitive code, use a local endpoint (Ollama, LM Studio) so data never leaves your machine.

---

## Troubleshooting

**401 Unauthorized** — Run *Commit Gen: Set API Key* and ensure the key matches the configured `baseUrl`.

**No staged changes** — Run `git add <files>` first, or use the Source Control panel to stage.

**Diff truncated warning** — Increase `commitgen.maxDiffChars` or stage fewer files at once.

**Ollama times out** — Increase `commitgen.requestTimeoutMs` (default 60s) if the model is slow to load.

---

## Acknowledgements

Inspired by [vscode-commitgen](https://github.com/WoongheeLee/vscode-commitgen) by WoongheeLee.
