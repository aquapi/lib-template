import { test } from 'node:test';
import assert from 'node:assert';

import { message } from '#self';

// Describe a group of tests
test('Numbers', (t) => {
  // A single test
  t.test('Equality', () => {
    // Assert
    assert.strictEqual(message, 'Hi');
  });
});
