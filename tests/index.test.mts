import { it } from 'node:test';
import assert from 'node:assert/strict';

import { message } from 'example';

it('exports', () => {
  assert.equal(message, 'Hi');
});
