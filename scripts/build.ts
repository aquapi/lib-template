import { rmSync, mkdirSync, writeFileSync } from 'node:fs';

import pkg from '../package.json';

import { cpSync, scanMultiple } from './lib/fs.ts';
import { LIB, ROOT, SOURCE } from './lib/constants.ts';
import { buildSync } from './lib/build.ts';

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
    // @ts-ignore
    const exports = (pkg.exports = {} as Record<string, string>);

    for (const path of scanMultiple(
      process.argv.length === 2 ? ['**/*.ts'] : process.argv.slice(2),
      SOURCE,
    ))
      buildSync(path, exports);

    pkg.devDependencies = pkg.scripts = undefined as any;
    writeFileSync(LIB + '/package.json', JSON.stringify(pkg));
  }
}
