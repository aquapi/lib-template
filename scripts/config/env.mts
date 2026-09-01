import { execFileSync } from 'node:child_process';
import defineConfig from '../src/lib/env.mts';
import sh from '../src/lib/sh.mts';

const pkg = (...args: string[]) => execFileSync('bun', args, { stdio: 'inherit' });

export default defineConfig({
  runtime: {
    runScript: (file) => sh`bun ${file}`,
  },
  packageManager: {
    init: () => pkg('i'),
    devInstall: () => pkg('i', '--no-save', './dist'),
    publish: () => pkg('publish', './dist', '--provenance', '--access=public'),
  },
});
