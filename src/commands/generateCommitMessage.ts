import * as vscode from 'vscode';
import type { IConfigService } from '../config/ConfigService.js';
import type { IGitService } from '../git/GitService.js';
import type { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { buildPrompt } from '../prompt/PromptBuilder.js';
import { withProgress } from '../ui/progress.js';
import { StreamingSink } from '../ui/StreamingSink.js';
import { log } from '../util/logger.js';
import {
  handleGenerateError,
  MissingApiKeyError,
  NoRepositoryError,
  NoStagedChangesError,
} from '../ui/notifications.js';

export function createGenerateCommand(
  git: IGitService,
  config: IConfigService,
  registry: ProviderRegistry,
): () => Promise<void> {
  return async function generateCommitMessage() {
    try {
      const repo = await git.getActiveRepository();
      if (!repo) throw new NoRepositoryError();

      const { stagedDiff, filesChanged } = await git.getStagedChanges(repo);
      if (!stagedDiff.trim()) throw new NoStagedChangesError();

      const cfg = config.read();

      // Ensure we have an API key (if the endpoint requires one)
      let apiKey = await config.getApiKey();
      if (!apiKey) {
        const isLocalEndpoint =
          cfg.baseUrl.startsWith('http://localhost') ||
          cfg.baseUrl.startsWith('http://127.0.0.1');

        if (!isLocalEndpoint) {
          const input = await vscode.window.showInputBox({
            prompt: `Enter your API key for ${cfg.baseUrl}`,
            password: true,
            ignoreFocusOut: true,
          });
          if (!input) throw new MissingApiKeyError();
          await config.setApiKey(input);
          apiKey = input;
        }
      }

      const recentCommits =
        cfg.includeRecentCommits
          ? await git.getRecentCommitSubjects(repo, cfg.recentCommitsCount)
          : [];

      const { request, wasTruncated } = buildPrompt({ stagedDiff, filesChanged, recentCommits, config: cfg });

      if (wasTruncated) {
        vscode.window.showWarningMessage(
          `Staged diff exceeds ${cfg.maxDiffChars} chars and was truncated. Consider using commitgen.maxDiffChars to adjust.`,
        );
      }

      const provider = registry.create(cfg.provider, {
        apiKey,
        baseUrl: cfg.baseUrl,
        extraHeaders: cfg.extraHeaders,
        requestTimeoutMs: cfg.requestTimeoutMs,
      });

      log(`Generating with model ${cfg.model} via ${cfg.baseUrl}`);

      const sink = new StreamingSink(repo);

      await withProgress('Generating commit message…', async (token) => {
        for await (const chunk of provider.generate(request, token)) {
          if (token.isCancellationRequested) break;
          sink.append(chunk.delta);
          if (chunk.done) break;
        }
        sink.finalize();
      });

      log('Generation complete.');
    } catch (err) {
      await handleGenerateError(err);
    }
  };
}
