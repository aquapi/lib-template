import type { Config as BuildConfig } from './lib/build.ts';
import type { Config as TestConfig } from './lib/test/index.ts';

export const test: TestConfig = {
  bun: {
    disabled: true,
    args: ['--randomize', '--smol', '--no-clear-screen']
  },
  node: {
    run: {},
  },
};

export const build: BuildConfig = {
  transform: {
    sourceType: 'module',
    typescript: {
      rewriteImportExtensions: true,
      declaration: {
        stripInternal: true,
      },
    },
    lang: 'ts',
  },
  minify: {
    compress: {
      module: true,
      defaults: false,
      dead_code: true,
      const_to_let: true,
      conditionals: true,
      booleans: true,
      drop_debugger: true,
      evaluate: true,
      join_vars: true,
      inline: 3,
      passes: 3,
    },
    mangle: false,
    module: true,
  },
  files: ['**/*.ts'],
};
