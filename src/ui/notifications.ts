import * as vscode from 'vscode';
import { LlmError } from '../providers/LlmProvider.js';
import { log } from '../util/logger.js';

export async function handleGenerateError(err: unknown): Promise<void> {
  log(`Error: ${String(err)}`);

  if (err instanceof LlmError) {
    switch (err.code) {
      case 'aborted':
        return; // Silent — user cancelled
      case 'auth': {
        const action = await vscode.window.showErrorMessage(err.message, 'Set API Key');
        if (action === 'Set API Key') {
          await vscode.commands.executeCommand('commitgen.setApiKey');
        }
        return;
      }
      case 'rate_limit':
        vscode.window.showWarningMessage(err.message);
        return;
      default:
        vscode.window.showErrorMessage(err.message);
        return;
    }
  }

  if (err instanceof NoRepositoryError) {
    const action = await vscode.window.showErrorMessage(err.message, 'Open Folder');
    if (action === 'Open Folder') {
      await vscode.commands.executeCommand('vscode.openFolder');
    }
    return;
  }

  if (err instanceof MissingApiKeyError) {
    return; // User cancelled the key prompt — silent
  }

  vscode.window.showErrorMessage(`Commit Message Generator: ${String(err)}`);
}

export class NoRepositoryError extends Error {
  constructor() {
    super('Open a folder containing a Git repository to generate a commit message.');
    this.name = 'NoRepositoryError';
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('No API key provided.');
    this.name = 'MissingApiKeyError';
  }
}
