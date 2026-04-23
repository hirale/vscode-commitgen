export interface TruncationResult {
  diff: string;
  truncated: boolean;
  originalChars: number;
}

/**
 * Truncate a unified diff to `maxChars` using a per-file fair-share strategy.
 * Each file gets an equal share; unused budget flows to large files.
 */
export function truncateDiff(diff: string, maxChars: number): TruncationResult {
  if (diff.length <= maxChars) {
    return { diff, truncated: false, originalChars: diff.length };
  }

  const files = splitIntoFileDiffs(diff);
  if (files.length === 0) {
    return { diff: diff.slice(0, maxChars), truncated: true, originalChars: diff.length };
  }

  // Fair-share with budget redistribution
  let remaining = maxChars;
  const budgets = new Array<number>(files.length).fill(0);
  let unallocated = files.length;

  // Sort indices by size ascending to give small files full budget first
  const sortedIdx = files.map((_, i) => i).sort((a, b) => files[a].length - files[b].length);

  for (const idx of sortedIdx) {
    const share = Math.floor(remaining / unallocated);
    const fileLen = files[idx].length;
    budgets[idx] = Math.min(share, fileLen);
    remaining -= budgets[idx];
    unallocated--;
  }

  const parts = files.map((fileDiff, i) => {
    const budget = budgets[i];
    if (fileDiff.length <= budget) return fileDiff;
    const truncatedLines = fileDiff.slice(0, budget).split('\n');
    // Remove the last partial line
    truncatedLines.pop();
    return truncatedLines.join('\n') + `\n… [truncated ${fileDiff.length - budget} chars]\n`;
  });

  return { diff: parts.join(''), truncated: true, originalChars: diff.length };
}

/** Split a unified diff into per-file chunks (starting at "diff --git" or "---"). */
function splitIntoFileDiffs(diff: string): string[] {
  const lines = diff.split('\n');
  const files: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      if (current.length > 0) {
        files.push(current.join('\n') + '\n');
        current = [];
      }
    }
    current.push(line);
  }
  if (current.length > 0) {
    files.push(current.join('\n') + '\n');
  }
  return files;
}
