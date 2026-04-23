import * as vscode from 'vscode';
import type { IConfigService } from '../config/ConfigService.js';
import { buildAuthHeaders } from '../util/httpHeaders.js';
import { log } from '../util/logger.js';

interface OpenAIModel {
  id: string;
  created?: number;
}

interface ScopeItem extends vscode.QuickPickItem {
  value: vscode.ConfigurationTarget;
}

export function createSelectModelCommand(config: IConfigService): () => Promise<void> {
  return async function selectModel() {
    const cfg = config.read();
    let models: string[] = [];

    try {
      const apiKey = await config.getApiKey();
      const headers = buildAuthHeaders(cfg.extraHeaders, apiKey);

      const response = await fetch(`${cfg.baseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json() as { data?: OpenAIModel[] };
        models = (data.data ?? [])
          .map((m) => m.id)
          .sort();
        log(`Fetched ${models.length} models from ${cfg.baseUrl}`);
      }
    } catch {
      // Endpoint might not support /models — fall through to manual entry
    }

    let picked: string | undefined;

    if (models.length > 0) {
      const items = models.map((id) => ({
        label: id,
        description: id === cfg.model ? '(current)' : undefined,
      }));
      const result = await vscode.window.showQuickPick(items, {
        placeHolder: `Current: ${cfg.model}`,
        matchOnDescription: true,
      });
      picked = result?.label;
    } else {
      picked = await vscode.window.showInputBox({
        prompt: `Enter model ID (endpoint ${cfg.baseUrl} didn't return a model list)`,
        value: cfg.model,
        ignoreFocusOut: true,
      });
    }

    if (!picked || picked === cfg.model) return;

    const vsConfig = vscode.workspace.getConfiguration('commitgen');
    const inspection = vsConfig.inspect<string>('model');

    let target: vscode.ConfigurationTarget;
    if (inspection?.workspaceValue !== undefined) {
      target = vscode.ConfigurationTarget.Workspace;
    } else if (inspection?.globalValue !== undefined) {
      target = vscode.ConfigurationTarget.Global;
    } else {
      const scopeItems: ScopeItem[] = [
        { label: 'Workspace', description: 'Save for this workspace only', value: vscode.ConfigurationTarget.Workspace },
        { label: 'User (Global)', description: 'Save for all workspaces', value: vscode.ConfigurationTarget.Global },
      ];
      const scopeChoice = await vscode.window.showQuickPick(scopeItems, {
        placeHolder: 'Save model setting to…',
      });
      if (!scopeChoice) return;
      target = scopeChoice.value;
    }

    await vsConfig.update('model', picked, target);
    vscode.window.showInformationMessage(`Model set to ${picked}`);
  };
}
