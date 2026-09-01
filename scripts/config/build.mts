import { transformSync } from 'oxc-transform';
import defineConfig from '../src/lib/build.mts';

export default defineConfig({
  scripts: ['install', 'uninstall', 'prepare', 'prepublish'],
  assets: ['LICENSE'],

  transform: (relativePath, content) =>
    transformSync(relativePath, content, {
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
