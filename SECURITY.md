# Security Policy

## API Key Storage

API keys are stored exclusively in VS Code's `SecretStorage` API, which delegates to the OS credential store (Keychain on macOS, Secret Service on Linux, Windows Credential Manager on Windows). Keys are **never** written to `settings.json` or any file that could be committed to source control.

## Data Privacy

The staged git diff is sent to the LLM endpoint you configure. For proprietary or sensitive code, consider using a local endpoint (Ollama, LM Studio) so data never leaves your machine.

## Reporting a Vulnerability

Please open a GitHub issue tagged `security`. Do not disclose publicly until a fix is released.
