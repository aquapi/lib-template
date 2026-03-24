import { run } from 'node:test';
import reporters from 'node:test/reporters';
import { test as CONFIG } from '../../config.ts';

const NODE_DEFAULT_PATTERNS = ['**/*.test.ts', '**/*_test.ts', '**/*.spec.ts', '**/*_spec.ts'];

const config = CONFIG.node;
run({
  globPatterns: NODE_DEFAULT_PATTERNS,
  ...config.run,
  watch: process.argv.includes('--watch', 2),
})
  .compose(reporters.spec)
  .pipe(process.stdout);
