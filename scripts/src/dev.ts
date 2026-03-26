import { watch } from 'chokidar';

import { ROOT, SOURCE } from '../lib/constants.ts';
import {
  buildSourceSync,
  linkSync,
  modifyPackageJson,
  removeSourceSync,
  unlinkSync,
} from '../lib/build.ts';
import { testTargets } from '../lib/test.ts';
import { matchesGlobs } from '../lib/fs.ts';

import { build as BUILD_CONFIG } from '../config.ts';
import { modifiers } from './build.ts';

//
// BUILD
//
watch('.', {
  ignored: (path, stats) => !!stats?.isFile() && !matchesGlobs(path, BUILD_CONFIG.files),
  cwd: SOURCE,
  interval: 100,
  ignoreInitial: true,
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

watch('.', {
  ignored: (path, stats) => !!stats?.isFile() && !matchesGlobs(path, BUILD_CONFIG.symlinks),
  cwd: ROOT,
  interval: 100,
  ignoreInitial: true,
})
  .on('add', (path) => {
    linkSync(path);
  })
  .on('unlink', (path) => {
    unlinkSync(path);
  })
  .on('error', (e) => {
    console.error(e);
  });

//
// TESTS
//
testTargets(true);
