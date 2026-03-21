import { test } from 'node:test';
import assert from 'node:assert';

// Describe a group of tests
test('Numbers', (t) => {
  // A single test
  t.test('Equality', () => {
    // Assert
    assert.strictEqual(1, 1);
  });
});
