import { describe, test, expect } from 'bun:test';

import { message } from '#self';

// Describe a group of tests
describe('Numbers', () => {
  // A single test
  test('Equality', () => {
    // Assert
    expect(message).toBe('Hi');
  });
});
