import { join } from 'node:path';

import { TESTS } from '../lib/constants.ts';
import { parseArgs } from 'node:util';
import { fmt } from '../lib/fmt.ts';
import { scanMultiple } from '../lib/fs.ts';

interface Target {
  (patterns: string[], watch: boolean): any;
}

const TARGETS: Record<string, Target> = {
  bun: (patterns, watch) => {
    const args = ['bun', 'test'];

    watch && args.push('--watch');
    for (const pat of scanMultiple(patterns, {
      cwd: join(TESTS, 'bun'),
      absolute: true,
    }))
      args.push(pat);

    return Bun.spawn(args, {
      stdout: 'inherit',
    }).exited;
  },
  node: (patterns, watch) => {
    const args = ['node', '--test'];

    watch && args.push('--watch');
    for (const pat of patterns) args.push(join(TESTS, 'node', pat));

    return Bun.spawn(args, {
      stdout: 'inherit',
    }).exited;
  },
};

{
  //
  // MAIN
  //
  const { values, positionals } = parseArgs({
    options: {
      watch: {
        type: 'boolean',
        default: false,
      },
      target: {
        type: 'string',
      },
    },
    allowPositionals: true,
    strict: false,
  });

  const patterns = positionals.length > 0 ? positionals : ['**/*.test.ts'];
  const target = values.target as string;
  const watch = !!values.watch;

  // Run all targets
  if (!target) {
    await Promise.all(Object.values(TARGETS).map((f) => f(patterns, watch)));
    process.exit(0);
  }

  // Unknown target
  if (!(target in TARGETS)) {
    console.log('unknown target:', target);
    console.log('available targets:', Object.keys(TARGETS).map(fmt.name).join(', '));
    process.exit(1);
  }

  // Run specific target
  await TARGETS[target](patterns, watch);
}
