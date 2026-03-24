import { join } from 'node:path';
import { TESTS } from './constants';

//
// CONFIG
//
const TARGETS = ['node', 'bun'];
type Target = (typeof TARGETS)[number];

// Bun test runner doesn't detect renaming files
const DISABLED_TARGETS: Target[] = ['bun'];

//
// MAIN
//
const NODE_DIR = join(TESTS, 'node');
const NODE_PATTERNS = [
  join(NODE_DIR, '**/*.test.ts'),
  join(NODE_DIR, '**/*_test.ts'),
  join(NODE_DIR, '**/*.spec.ts'),
  join(NODE_DIR, '**/*_spec.ts'),
];
const BUN_DIR = join(TESTS, 'bun');

export const testTargets = (watch: boolean, targets = TARGETS) =>
  Promise.all(
    (targets.length > 0 ? targets : TARGETS).map((target) => {
      if (DISABLED_TARGETS.includes(target)) return Promise.resolve(0);

      return target === 'node'
        ? Bun.spawn(
            (watch ? ['node', '--test', '--watch'] : ['node', '--test']).concat(NODE_PATTERNS),
            {
              stdout: 'inherit',
              stderr: 'inherit',
            },
          ).exited
        : target === 'bun'
          ? Bun.spawn((watch ? ['bun', '--watch', '--no-clear-screen', 'test'] : ['bun', 'test']).concat(BUN_DIR), {
              stdout: 'inherit',
              stderr: 'inherit',
            }).exited
          : Promise.resolve(0);
    }),
  );
