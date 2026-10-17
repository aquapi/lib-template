import { spawnSync } from 'node:child_process';
import defineConfig from '../lib/env.mts';
import sh from '../lib/sh.mts';

const pm = (...args: string[]) => spawnSync('bun', args, { stdio: 'inherit' });

export default defineConfig({
  runtime: {
    runScript: (file) => sh`bun ${file}`,
  },
  packageManager: {
    init: () => pm('i'),
    devInstall: () => pm('i', '--no-save', './dist'),
    publish: () => pm('publish', './dist', '--provenance', '--access=public'),
  },
});
