import * as vscode from 'vscode';
import { getStagedDiff, getStagedFilePaths, getUnstagedDiff, getUnstagedFilePaths, getRecentCommitSubjects } from './gitCli.js';

export interface GitRepositoryHandle {
  readonly rootUri: vscode.Uri;
  readonly rootFsPath: string;
  readonly inputBox: { value: string };
}

export interface StagedChanges {
  stagedDiff: string;
  filesChanged: string[];
}

export interface IGitService {
  getActiveRepository(preferredUri?: vscode.Uri): Promise<GitRepositoryHandle | undefined>;
  getStagedChanges(repo: GitRepositoryHandle): Promise<StagedChanges>;
  getUnstagedChanges(repo: GitRepositoryHandle): Promise<StagedChanges>;
  getRecentCommitSubjects(repo: GitRepositoryHandle, count: number): Promise<string[]>;
}

export class GitService implements IGitService {
  async getActiveRepository(preferredUri?: vscode.Uri): Promise<GitRepositoryHandle | undefined> {
    const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (!gitExt) return undefined;

    const git = gitExt.isActive ? gitExt.exports : await gitExt.activate();
    const api = git.getAPI(1);
    const repos = api.repositories;
    if (repos.length === 0) return undefined;

    if (preferredUri) {
      const match = api.getRepository(preferredUri);
      if (match) return toHandle(match);
    }

    if (repos.length === 1) return toHandle(repos[0]);

    // Multiple repos: pick the one containing the active editor, or let user choose
    const activeUri = vscode.window.activeTextEditor?.document.uri;
    if (activeUri) {
      const match = api.getRepository(activeUri);
      if (match) return toHandle(match);
    }

    const items = repos.map((r) => ({
      label: vscode.workspace.asRelativePath(r.rootUri),
      repo: r,
    }));
    const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a repository' });
    return picked ? toHandle(picked.repo) : undefined;
  }

  async getStagedChanges(repo: GitRepositoryHandle): Promise<StagedChanges> {
    const [stagedDiff, filesChanged] = await Promise.all([
      getStagedDiff(repo.rootFsPath),
      getStagedFilePaths(repo.rootFsPath),
    ]);
    return { stagedDiff, filesChanged };
  }

  async getUnstagedChanges(repo: GitRepositoryHandle): Promise<StagedChanges> {
    const [stagedDiff, filesChanged] = await Promise.all([
      getUnstagedDiff(repo.rootFsPath),
      getUnstagedFilePaths(repo.rootFsPath),
    ]);
    return { stagedDiff, filesChanged };
  }

  async getRecentCommitSubjects(repo: GitRepositoryHandle, count: number): Promise<string[]> {
    return getRecentCommitSubjects(repo.rootFsPath, count);
  }
}

function toHandle(repo: Repository): GitRepositoryHandle {
  return {
    rootUri: repo.rootUri,
    rootFsPath: repo.rootUri.fsPath,
    inputBox: repo.inputBox,
  };
}

// Minimal typings for the vscode.git extension API
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  readonly repositories: Repository[];
  getRepository(uri: vscode.Uri): Repository | null;
}

interface Repository {
  readonly rootUri: vscode.Uri;
  readonly inputBox: { value: string };
}
