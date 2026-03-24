import { watch } from 'chokidar';

import { SOURCE, BUILD_FILES_PATTERN } from '../lib/constants.ts';
import { buildSourceSync, modifyPackageJson, removeSourceSync } from '../lib/build.ts';
import { testTargets } from '../lib/test.ts';

{
  //
  // BUILD
  //
  const modifiers = {
    exports: {},
    devDependencies: undefined,
    scripts: undefined,
  };

  const GLOB = new Bun.Glob(BUILD_FILES_PATTERN);

  watch('.', {
    ignored: (path, stats) => !!stats?.isFile() && !GLOB.match(path),
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
