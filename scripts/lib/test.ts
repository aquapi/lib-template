import { join } from 'node:path';
import { TESTS } from './constants';

const NODE_DIR = join(TESTS, 'node');
const NODE_PATTERNS = [
  join(NODE_DIR, '**/*.test.ts'),
  join(NODE_DIR, '**/*_test.ts'),
  join(NODE_DIR, '**/*.spec.ts'),
  join(NODE_DIR, '**/*_spec.ts'),
];
export const testNode = (watch?: boolean) =>
  Bun.spawn((watch ? ['node', '--test', '--watch'] : ['node', '--test']).concat(NODE_PATTERNS), {
    stdout: 'inherit',
    stderr: 'inherit'
  });

const BUN_DIR = join(TESTS, 'bun');
export const testBun = (watch?: boolean) =>
  Bun.spawn((watch ? ['bun', 'test', '--watch'] : ['bun', 'test']).concat(BUN_DIR), {
    stdout: 'inherit',
    stderr: 'inherit'
  });
