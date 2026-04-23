import type { GitRepositoryHandle } from '../git/GitService.js';

const FLUSH_INTERVAL_MS = 50;

/**
 * Buffers streaming deltas and writes to the SCM input box at a controlled rate.
 * Aborts if the user edits the input box mid-stream; fires onUserEdit so the
 * caller can cancel the underlying HTTP request.
 */
export class StreamingSink {
  private buffer = '';
  private lastWritten = '';
  private aborted = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly repo: GitRepositoryHandle,
    private readonly onUserEdit?: () => void,
  ) {
    this.repo.inputBox.value = '';
  }

  append(delta: string): void {
    if (this.aborted || !delta) return;
    this.buffer += delta;
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  private clearTimer(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  flush(): void {
    this.clearTimer();

    if (this.aborted) return;

    // If user edited the box, stop overwriting and cancel the request
    if (this.repo.inputBox.value !== this.lastWritten) {
      this.aborted = true;
      this.onUserEdit?.();
      return;
    }

    this.lastWritten = this.buffer;
    this.repo.inputBox.value = this.buffer;
  }

  finalize(): void {
    this.clearTimer();
    if (!this.aborted) {
      const value = stripModelPrelude(this.buffer);
      this.lastWritten = value;
      this.repo.inputBox.value = value;
    }
  }

  get isAborted(): boolean {
    return this.aborted;
  }
}

/**
 * Strips common model-generated preamble text that shouldn't appear in a
 * commit message: code fences, "Here is..." / "Sure, here's..." openers.
 */
export function stripModelPrelude(text: string): string {
  let t = text.trim();

  const fenceMatch = t.match(/^```(?:\w+)?\s*\n([\s\S]*)\n```\s*$/);
  if (fenceMatch) {
    t = fenceMatch[1].trim();
  }

  t = t.replace(/^(?:here(?:'s| is)[^\n]*\n|sure[^\n]*\n)/i, '').trim();

  return t;
}
