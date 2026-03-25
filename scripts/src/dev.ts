import { watch } from 'chokidar';

import { SOURCE } from '../lib/constants.ts';
import { buildSourceSync, modifyPackageJson, removeSourceSync } from '../lib/build.ts';
import { testTargets } from '../lib/test.ts';

import { build as BUILD_CONFIG } from '../config.ts';
import { toGlobs } from '../lib/fs.ts';

{
  //
  // BUILD
  //
  const modifiers = {
    exports: {},
    devDependencies: undefined,
    scripts: undefined,
  };

  const GLOBS = toGlobs(BUILD_CONFIG.files);

  watch('.', {
    ignored: (path, stats) => {
      if (!stats?.isFile()) return false;

      for (let i = 0; i < GLOBS.length; i++) if (GLOBS[i].match(path)) return false;
      return true;
    },
    cwd: SOURCE,
    interval: 100,
  })
    .on('add', (path) => {
      buildSourceSync(true, path, modifiers.exports);
      modifyPackageJson(modifiers);
    })
    .on('change', (path) => {
      buildSourceSync(true, path, {});
    })
    .on('unlink', (path) => {
      removeSourceSync(path, modifiers.exports);
      modifyPackageJson(modifiers);
    })
    .on('error', (e) => {
      console.error(e);
    });
}

//
// TESTS
//
testTargets(true);
