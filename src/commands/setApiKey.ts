import * as vscode from 'vscode';
import type { IConfigService } from '../config/ConfigService.js';
import { log } from '../util/logger.js';

export function createSetApiKeyCommand(config: IConfigService): () => Promise<void> {
  return async function setApiKey() {
    const cfg = config.read();
    const current = await config.getApiKey();

    const input = await vscode.window.showInputBox({
      prompt: `API key for ${cfg.baseUrl}`,
      password: true,
      ignoreFocusOut: true,
      value: current ? '(already set — enter new value to replace)' : '',
      placeHolder: 'sk-…',
    });

    if (input === undefined) return; // Cancelled

    if (!input.trim() || input === '(already set — enter new value to replace)') {
      vscode.window.showInformationMessage('API key unchanged.');
      return;
    }

    await config.setApiKey(input.trim());
    log(`API key set for ${cfg.baseUrl}`);
    vscode.window.showInformationMessage('API key saved.');
  };
}
