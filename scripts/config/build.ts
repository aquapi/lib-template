import path from 'node:path';
import type { BuildConfig } from '../src/build.ts';

const buildConfig: BuildConfig = {
  output: 'dist',

  scripts: [],

  assets: [],
  exts: {
    default: '.ts',
    browser: '.browser.ts',
  },

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
};

// Normalize config
{
  buildConfig.output = './' + path.relative('.', buildConfig.output);
}

export default buildConfig;
