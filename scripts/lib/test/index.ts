import { join } from 'node:path';
import { run, type RunOptions } from 'node:test';

import { TESTS } from '../constants.ts';
import { fmt } from '../fmt.ts';

import { test as CONFIG } from '../../config.ts';

//
// CONFIG
//
const TARGETS = ['node', 'bun'] as const;

// Specific target options
interface SpecificConfig {
  node: {
    run?: Omit<RunOptions, 'watch' | 'cwd'>;
  };
  bun: {
    smol?: true;
    clearScreen?: true;
    randomize?: true;
    sequential?: true;
    dirs?: string[];
  };
}
export type Config = {
  [K in (typeof TARGETS)[number]]: {
    disabled?: true;
  } & (K extends keyof SpecificConfig ? SpecificConfig[K] : {});
};

//
// MAIN
//
const NODE_RUNNER = join(import.meta.dir, 'node-runner.ts');
const NODE_DIR = join(TESTS, 'node');
const BUN_DIR = join(TESTS, 'bun');

export const testTargets = (watch: boolean, targets: readonly string[] = TARGETS) =>
  Promise.all(
    (targets.length > 0 ? targets : TARGETS).map((target) => {
      const genericConfig = CONFIG[target as (typeof TARGETS)[number]];

      // Unknown target
      if (genericConfig == null) {
        console.log('unknown target:', fmt.name(target));
        console.log('available targets:', TARGETS.map(fmt.name).join(', '));
        process.exit(1);
      }

      // Generic target configurations
      if (genericConfig.disabled) {
        console.log('target disabled:', fmt.name(target));
        return;
      }

      console.log('test target:', fmt.name(target));

      // Specific targets
      if (target === 'node') {
        const args = ['node', NODE_RUNNER];
        watch && args.push('--watch');

        return Bun.spawn(args, {
          cwd: NODE_DIR,
          stdout: 'inherit',
          stderr: 'inherit',
        }).exited;
      }

      if (target === 'bun') {
        const config = genericConfig as Config['bun'];

        const args = ['bun', 'test'];
        watch && args.push('--watch');

        config.randomize && args.push('--randomize');
        config.sequential || args.push('--concurrent');
        config.smol && args.push('--smol');
        config.clearScreen || args.push('--no-clear-screen');
        config.dirs ? args.push(...config.dirs) : args.push(BUN_DIR);

        return Bun.spawn(args, {
          cwd: BUN_DIR,
          stdout: 'inherit',
          stderr: 'inherit',
        }).exited;
      }

      console.log('unhandled target:', fmt.name(target));
    }),
  );
