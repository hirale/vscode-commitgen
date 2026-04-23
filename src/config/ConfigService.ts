import * as vscode from 'vscode';
import type { ResolvedConfig } from './types.js';

export interface IConfigService {
  read(): ResolvedConfig;
  getApiKey(): Promise<string | undefined>;
  setApiKey(key: string): Promise<void>;
  clearApiKey(): Promise<void>;
  onDidChange(listener: () => void): vscode.Disposable;
}

export class ConfigService implements IConfigService {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  read(): ResolvedConfig {
    const resource = vscode.workspace.workspaceFolders?.[0]?.uri;
    const cfg = vscode.workspace.getConfiguration('commitgen', resource);
    return {
      provider: cfg.get<string>('provider', 'openai-compatible'),
      baseUrl: cfg.get<string>('baseUrl', 'https://api.openai.com/v1').replace(/\/$/, ''),
      model: cfg.get<string>('model', 'gpt-4o-mini'),
      language: cfg.get<string>('language', 'English'),
      conventionalCommits: cfg.get<boolean>('conventionalCommits', true),
      includeRecentCommits: cfg.get<boolean>('includeRecentCommits', false),
      recentCommitsCount: cfg.get<number>('recentCommitsCount', 5),
      maxDiffChars: cfg.get<number>('maxDiffChars', 16000),
      temperature: cfg.get<number>('temperature', 0.2),
      maxOutputTokens: cfg.get<number>('maxOutputTokens', 512),
      stream: cfg.get<boolean>('stream', true),
      systemPromptOverride: cfg.get<string>('systemPromptOverride', ''),
      extraHeaders: cfg.get<Record<string, string>>('extraHeaders', {}),
      requestTimeoutMs: cfg.get<number>('requestTimeoutMs', 60000),
    };
  }

  async getApiKey(): Promise<string | undefined> {
    return this.secrets.get(this.currentSecretKey());
  }

  async setApiKey(key: string): Promise<void> {
    await this.secrets.store(this.currentSecretKey(), key);
  }

  async clearApiKey(): Promise<void> {
    await this.secrets.delete(this.currentSecretKey());
  }

  private currentSecretKey(): string {
    const cfg = vscode.workspace.getConfiguration('commitgen');
    return this.secretKey(
      cfg.get<string>('provider', 'openai-compatible'),
      cfg.get<string>('baseUrl', 'https://api.openai.com/v1').replace(/\/$/, ''),
    );
  }

  onDidChange(listener: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('commitgen')) {
        listener();
      }
    });
  }

  /** Scope key by provider + baseUrl so switching endpoints doesn't collide. */
  private secretKey(provider: string, baseUrl: string): string {
    const hash = simpleHash(baseUrl);
    return `commitgen.apiKey.${provider}.${hash}`;
  }
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}
