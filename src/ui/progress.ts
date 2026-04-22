import * as vscode from 'vscode';

export async function withProgress<T>(
  title: string,
  task: (token: vscode.CancellationToken) => Promise<T>,
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true,
    },
    (_progress, token) => task(token),
  );
}
