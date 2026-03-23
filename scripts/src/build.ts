import { rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { watch } from 'chokidar';

import pkg from '../../package.json';

import { cpSync, scanMultipleGlobs } from '../lib/fs.ts';
import { LIB, ROOT, SOURCE } from '../lib/constants.ts';
import { buildSourceSync, removeSourceSync } from '../lib/build.ts';

{
  const { values, positionals } = parseArgs({
    options: {
      watch: {
        type: 'boolean',
      },
    },
    allowPositionals: true,
  });

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

  // Cache the globs for faster search
  const globs = (positionals.length > 0 ? positionals : ['**/*.ts']).map(
    (pat) => new Bun.Glob(pat),
  );

  // Build files and add exports to lib/package.json
  {
    const updatePackage = () => {
      writeFileSync(LIB + '/package.json', JSON.stringify(pkg));
    };

    // @ts-ignore
    const exports = (pkg.exports = {} as Record<string, string>);
    for (const path of scanMultipleGlobs(globs, SOURCE)) buildSourceSync(path, exports);
    pkg.devDependencies = pkg.scripts = undefined as any;
    updatePackage();

    // Watch mode
    values.watch &&
      watch(SOURCE, {
        ignored: (path, stats) => {
          if (stats?.isFile()) {
            for (let i = 0; i < globs.length; i++) if (globs[i].match(path)) return false;
            return true;
          }

          return false;
        },
        ignoreInitial: true,
        cwd: SOURCE,
        interval: 100,
      })
        .on('add', (path) => {
          buildSourceSync(path, exports);
          updatePackage();
        })
        .on('change', (path) => {
          buildSourceSync(path, {});
        })
        .on('unlink', (path) => {
          removeSourceSync(path, exports);
          updatePackage();
        })
        .on('error', (e) => {
          console.error(e);
        });
  }
}
