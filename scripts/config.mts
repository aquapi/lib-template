import { defineConfig } from './lib/config.mts';
import sh from './lib/sh.mts';

export default defineConfig({
  package: {
    assets: ['README.md', 'LICENSE'],
    scripts: {
      include: ['install', 'uninstall', 'prepare', 'prepublish'],
      runFile: (file) => sh`node ${file}`,
    },
  },
});
