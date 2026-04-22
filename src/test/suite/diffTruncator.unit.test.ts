import * as assert from 'assert';
import { truncateDiff } from '../../prompt/diffTruncator.js';

const FILE_A = `diff --git a/a.ts b/a.ts
--- a/a.ts
+++ b/a.ts
@@ -1 +1,2 @@
 export const a = 1;
+export const a2 = 2;
`;

const FILE_B = `diff --git a/b.ts b/b.ts
--- a/b.ts
+++ b/b.ts
@@ -1 +1,2 @@
 export const b = 1;
+export const b2 = 2;
`;

suite('diffTruncator', () => {
  test('returns unchanged diff when within limit', () => {
    const diff = FILE_A + FILE_B;
    const result = truncateDiff(diff, diff.length + 100);
    assert.strictEqual(result.truncated, false);
    assert.strictEqual(result.diff, diff);
  });

  test('truncates diff when exceeding limit', () => {
    const diff = FILE_A + FILE_B;
    const result = truncateDiff(diff, 50);
    assert.strictEqual(result.truncated, true);
    assert.ok(result.diff.length <= 200); // reasonable upper bound with annotations
  });

  test('annotates truncated sections', () => {
    const bigDiff = `diff --git a/big.ts b/big.ts\n` + 'x'.repeat(500);
    const result = truncateDiff(bigDiff, 100);
    assert.ok(result.diff.includes('truncated'));
  });

  test('records originalChars', () => {
    const diff = FILE_A + FILE_B;
    const result = truncateDiff(diff, 50);
    assert.strictEqual(result.originalChars, diff.length);
  });
});
