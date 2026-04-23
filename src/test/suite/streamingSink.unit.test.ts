import * as assert from 'assert';
import { stripModelPrelude } from '../../ui/StreamingSink.js';

suite('stripModelPrelude', () => {
  test('passes through a plain commit message unchanged', () => {
    const msg = 'feat(auth): add OAuth2 login flow';
    assert.strictEqual(stripModelPrelude(msg), msg);
  });

  test('strips wrapping ```commit fence', () => {
    const input = '```commit\nfeat: add thing\n```';
    assert.strictEqual(stripModelPrelude(input), 'feat: add thing');
  });

  test('strips wrapping plain ``` fence', () => {
    const input = '```\nfix: resolve NPE\n```';
    assert.strictEqual(stripModelPrelude(input), 'fix: resolve NPE');
  });

  test('strips a "Here is the commit message:" opener line', () => {
    const input = "Here is the commit message:\nfeat: implement search";
    assert.strictEqual(stripModelPrelude(input), 'feat: implement search');
  });

  test('strips a "Here\'s your commit message:" opener line', () => {
    const input = "Here's your commit message:\nrefactor: extract helper";
    assert.strictEqual(stripModelPrelude(input), 'refactor: extract helper');
  });

  test('strips a "Sure, here\'s..." opener line', () => {
    const input = "Sure, here's a commit message for you:\nchore: update deps";
    assert.strictEqual(stripModelPrelude(input), 'chore: update deps');
  });

  test('trims surrounding whitespace', () => {
    const input = '\n\nfix: trim me\n\n';
    assert.strictEqual(stripModelPrelude(input), 'fix: trim me');
  });

  test('preserves multi-line body inside fences', () => {
    const input = '```commit\nfeat: add thing\n\nThis adds the thing.\n```';
    assert.strictEqual(stripModelPrelude(input), 'feat: add thing\n\nThis adds the thing.');
  });
});
