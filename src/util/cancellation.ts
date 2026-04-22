import type * as vscode from 'vscode';

/** Bridge a VS Code CancellationToken to a DOM AbortController. */
export function tokenToAbortController(token: vscode.CancellationToken): AbortController {
  const controller = new AbortController();
  if (token.isCancellationRequested) {
    controller.abort();
  } else {
    token.onCancellationRequested(() => controller.abort());
  }
  return controller;
}
