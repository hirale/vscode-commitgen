import type * as vscode from 'vscode';

export interface AbortHandle {
  controller: AbortController;
  dispose: () => void;
}

/** Bridge a VS Code CancellationToken to a DOM AbortController. */
export function tokenToAbortController(token: vscode.CancellationToken): AbortHandle {
  const controller = new AbortController();
  if (token.isCancellationRequested) {
    controller.abort();
    return { controller, dispose: () => {} };
  }
  const disposable = token.onCancellationRequested(() => controller.abort());
  return { controller, dispose: () => disposable.dispose() };
}
