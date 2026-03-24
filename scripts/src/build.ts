import { rmSync, mkdirSync } from 'node:fs';

import { cpSync } from '../lib/fs.ts';
import { LIB, ROOT, SOURCE, BUILD_FILES_PATTERN } from '../lib/constants.ts';
import { buildSourceSync, modifyPackageJson } from '../lib/build.ts';

{
  //
  // MAIN
  //
  try {
    rmSync(LIB, { recursive: true });
  } catch {}
  mkdirSync(LIB, { recursive: true });
  // try {
  //   symlinkSync(LIB, join(NODE_MODULES, pkg.name));
  // } catch {}
  cpSync(ROOT, LIB, 'README.md');

  // Build files and add exports to lib/package.json
  {
    const modifiers = {
      exports: {},
      devDependencies: undefined,
      scripts: undefined,
    };
    for (const path of new Bun.Glob(BUILD_FILES_PATTERN).scanSync(SOURCE))
      buildSourceSync(false, path, modifiers.exports);
    modifyPackageJson(modifiers);
  }
}
