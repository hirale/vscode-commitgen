import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function parseLines(stdout: string): string[] {
  return stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

function throwIfGitNotFound(err: unknown): never {
  if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    throw new Error('Git executable not found — install Git and restart VS Code.');
  }
  throw err as Error;
}

export async function getStagedDiff(repoRoot: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', repoRoot, 'diff', '--cached', '--no-color', '-U3'],
    { maxBuffer: 10 * 1024 * 1024 },
  ).catch(throwIfGitNotFound);
  return stdout;
}

export async function getStagedFilePaths(repoRoot: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', repoRoot, 'diff', '--cached', '--name-only'],
    { maxBuffer: 1024 * 1024 },
  ).catch(throwIfGitNotFound);
  return parseLines(stdout);
}

export async function getUnstagedDiff(repoRoot: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', repoRoot, 'diff', '--no-color', '-U3'],
    { maxBuffer: 10 * 1024 * 1024 },
  ).catch(throwIfGitNotFound);
  return stdout;
}

export async function getUnstagedFilePaths(repoRoot: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', repoRoot, 'diff', '--name-only'],
    { maxBuffer: 1024 * 1024 },
  ).catch(throwIfGitNotFound);
  return parseLines(stdout);
}

export async function getRecentCommitSubjects(repoRoot: string, count: number): Promise<string[]> {
  if (count <= 0) return [];
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', repoRoot, 'log', `-${count}`, '--pretty=format:%s'],
      { maxBuffer: 1024 * 1024 },
    );
    return parseLines(stdout);
  } catch {
    // Empty repo (no commits yet) or other git log failure — treat as no history
    return [];
  }
}
