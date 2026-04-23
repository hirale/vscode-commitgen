import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function getStagedDiff(repoRoot: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', repoRoot, 'diff', '--cached', '--no-color', '-U3'],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  return stdout;
}

export async function getStagedFilePaths(repoRoot: string): Promise<string[]> {
  const { stdout } = await execFileAsync(
    'git',
    ['-C', repoRoot, 'diff', '--cached', '--name-only'],
    { maxBuffer: 1024 * 1024 },
  );
  return stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

export async function getRecentCommitSubjects(repoRoot: string, count: number): Promise<string[]> {
  if (count <= 0) return [];
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', repoRoot, 'log', `-${count}`, '--pretty=format:%s'],
      { maxBuffer: 1024 * 1024 },
    );
    return stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    // Empty repo (no commits yet) or other git log failure — treat as no history
    return [];
  }
}
