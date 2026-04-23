import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

function getLogger(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Commit Message Generator');
  }
  return channel;
}

export function log(message: string): void {
  getLogger().appendLine(`[${new Date().toISOString()}] ${message}`);
}

export function showLog(): void {
  getLogger().show();
}

export function disposeLogger(): void {
  channel?.dispose();
  channel = undefined;
}
