import * as vscode from 'vscode';
import { ConfigService } from './config/ConfigService.js';
import { GitService } from './git/GitService.js';
import { ProviderRegistry } from './providers/ProviderRegistry.js';
import { createOpenAICompatibleProvider } from './providers/openaiCompatible/OpenAICompatibleProvider.js';
import { createGenerateCommand } from './commands/generateCommitMessage.js';
import { createSetApiKeyCommand } from './commands/setApiKey.js';
import { createSelectModelCommand } from './commands/selectModel.js';
import { log, showLog, disposeLogger } from './util/logger.js';

export function activate(context: vscode.ExtensionContext): void {
  log('Commit Message Generator activated.');

  const config = new ConfigService(context.secrets);
  const git = new GitService();

  const registry = new ProviderRegistry();
  registry.register('openai-compatible', createOpenAICompatibleProvider);

  // Allow tests to inject a fake provider
  const testProvider = (global as Record<string, unknown>)['__commitgen_test_provider__'];
  if (testProvider && typeof testProvider === 'object' && 'capabilities' in testProvider) {
    registry.register('fake', () => testProvider as ReturnType<typeof createOpenAICompatibleProvider>);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('commitgen.generate', createGenerateCommand(git, config, registry)),
    vscode.commands.registerCommand('commitgen.setApiKey', createSetApiKeyCommand(config)),
    vscode.commands.registerCommand('commitgen.selectModel', createSelectModelCommand(config)),
    vscode.commands.registerCommand('commitgen.showLog', showLog),
  );
}

export function deactivate(): void {
  disposeLogger();
}
