import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration', () => {
  test('extension activates and registers all commands', async () => {
    const ext = vscode.extensions.getExtension('your-publisher.commit-message-generator');
    assert.ok(ext, 'Extension not found — is the publisher ID correct?');

    if (!ext.isActive) {
      await ext.activate();
    }

    const allCommands = await vscode.commands.getCommands(true);
    assert.ok(allCommands.includes('commitgen.generate'), 'commitgen.generate not registered');
    assert.ok(allCommands.includes('commitgen.setApiKey'), 'commitgen.setApiKey not registered');
    assert.ok(allCommands.includes('commitgen.selectModel'), 'commitgen.selectModel not registered');
  });
});
