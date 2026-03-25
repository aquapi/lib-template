import { rmSync, mkdirSync } from 'node:fs';

import { cpSync, scanMultiple } from '../lib/fs.ts';
import { LIB, ROOT, SOURCE } from '../lib/constants.ts';
import { buildSourceSync, modifyPackageJson } from '../lib/build.ts';
import { build as CONFIG } from '../config.ts';

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
      imports: undefined,
    };
    for (const path of scanMultiple(CONFIG.files, SOURCE))
      buildSourceSync(false, path, modifiers.exports);
    modifyPackageJson(modifiers);
  }
}
