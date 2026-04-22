import * as vscode from 'vscode';
import type { IConfigService } from '../config/ConfigService.js';
import { log } from '../util/logger.js';

interface OpenAIModel {
  id: string;
  created?: number;
}

export function createSelectModelCommand(config: IConfigService): () => Promise<void> {
  return async function selectModel() {
    const cfg = config.read();
    let models: string[] = [];

    try {
      const apiKey = await config.getApiKey();
      const headers: Record<string, string> = { ...cfg.extraHeaders };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

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

    await vscode.workspace
      .getConfiguration('commitgen')
      .update('model', picked, vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage(`Model set to ${picked}`);
  };
}
