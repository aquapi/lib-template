import { $ } from 'bun';
import { join } from 'node:path';

import { TESTS } from './lib/constants.ts';

interface Target {
  (patterns: string[], watch: boolean): any;
}

const TARGETS: Record<string, Target> = {
  bun: (patterns, watch) => {
    return $`bun test ${watch && '--watch'} --only-failures --pass-with-no-tests ${patterns.map((pat) => join(TESTS, 'bun', pat))
      }`;
  },
  node: (patterns, watch) => {
    return $`node --test ${watch && '--watch'} ${patterns.map((pat) => join(TESTS, 'node', pat))}`;
  },
};

{
  //
  // MAIN
  //
  const args = process.argv.slice(2);
}
