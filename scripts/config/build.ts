import { transformSync } from 'oxc-transform';
import defineConfig from '../src/lib/build.ts';

export default defineConfig({
  output: 'dist',

  scripts: [],

  assets: [],
  exts: {
    default: '.ts',
    browser: '.browser.ts',
  },

  transform: (file, content) =>
    transformSync(file, content, {
      sourceType: 'module',
      typescript: {
        rewriteImportExtensions: true,
        declaration: {
          stripInternal: true,
        },
      },
      lang: 'ts',
    }),
});
