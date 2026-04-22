import type { GitRepositoryHandle } from '../git/GitService.js';

const FLUSH_INTERVAL_MS = 50;

/**
 * Buffers streaming deltas and writes to the SCM input box at a controlled rate.
 * Aborts if the user edits the input box mid-stream.
 */
export class StreamingSink {
  private buffer = '';
  private lastWritten = '';
  private aborted = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly repo: GitRepositoryHandle) {
    this.repo.inputBox.value = '';
  }

  append(delta: string): void {
    if (this.aborted || !delta) return;
    this.buffer += delta;
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  flush(): void {
    clearTimeout(this.timer);
    this.timer = undefined;

    if (this.aborted) return;

    // If user edited the box, stop overwriting
    if (this.repo.inputBox.value !== this.lastWritten) {
      this.aborted = true;
      return;
    }

    this.lastWritten = this.buffer;
    this.repo.inputBox.value = this.buffer;
  }

  finalize(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.aborted) {
      this.lastWritten = this.buffer;
      this.repo.inputBox.value = this.buffer;
    }
  }

  get isAborted(): boolean {
    return this.aborted;
  }
}
