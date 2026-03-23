import { rmSync, readFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { basename, dirname } from 'node:path/posix';
import { join } from 'node:path';

import { minifySync, type JsMinifyOptions } from '@swc/core';
import { transformSync, type TransformOptions } from 'oxc-transform';

import pkg from '../package.json';

import { cp, scanMultiple } from './lib/fs.ts';
import { LIB, ROOT, SOURCE } from './lib/constants.ts';

const TRANSFORM_OPTIONS: TransformOptions = {
  sourceType: 'module',
  typescript: {
    rewriteImportExtensions: true,
    declaration: {
      stripInternal: true,
    },
  },
  lang: 'ts',
};

const MINIFY_OPTIONS: JsMinifyOptions = {
  compress: {
    module: true,
    defaults: false,
    dead_code: true,
    const_to_let: true,
    conditionals: true,
    booleans: true,
    drop_debugger: true,
    evaluate: true,
    join_vars: true,
    inline: 3,
    passes: 3,
  },
  mangle: false,
  module: true,
};

{
  try {
    rmSync(LIB, { recursive: true });
  } catch {}
  mkdirSync(LIB, { recursive: true });
  // try {
  //   symlinkSync(LIB, join(NODE_MODULES, pkg.name));
  // } catch {}
  cp(ROOT, LIB, 'README.md');

  // Build files and add exports to lib/package.json
  {
    // @ts-ignore
    const exports = (pkg.exports = {} as Record<string, string>);

    for (const path of scanMultiple(
      process.argv.length === 2 ? ['**/*.ts'] : process.argv.slice(2),
      SOURCE,
    )) {
      const pathNoExt = path.slice(0, path.lastIndexOf('.') >>> 0);
      const pathName = basename(pathNoExt);

      const transformed = transformSync(
        path,
        readFileSync(join(SOURCE, path), { encoding: 'utf8' }),
        TRANSFORM_OPTIONS,
      );

      const hasCode = transformed.code && transformed.code.trim() !== 'export {};';
      const hasDecl = transformed.declaration && transformed.declaration.trim() !== 'export {};';

      hasCode &&
        Bun.write(`${LIB}/${pathNoExt}.js`, minifySync(transformed.code, MINIFY_OPTIONS).code);

      hasDecl && Bun.write(`${LIB}/${pathNoExt}.d.ts`, transformed.declaration!);

      if (hasCode || hasDecl) {
        const isRuntimeKey = pathName.startsWith('_');

        const exportPath =
          pathName === 'index' || isRuntimeKey // Runtime key
            ? dirname(pathNoExt)
            : pathNoExt;
        const sourcePath = './' + pathNoExt + (hasCode ? '.js' : '.d.ts');

        if (isRuntimeKey) {
          if (typeof exports[exportPath] === 'string') {
            // @ts-ignore
            exports[exportPath] = {
              default: exports[exportPath],
              [pathName.slice(1)]: sourcePath,
            };
            console.warn(`Change ${exportPath}/index to ${exportPath}/_default instead!`);
          } else
            // @ts-ignore
            (exports[exportPath] ??= {})[pathName.slice(1)] = sourcePath;
        } else exports[exportPath] = sourcePath;
      }
    }

    pkg.devDependencies = pkg.scripts = undefined as any;
    Bun.write(LIB + '/package.json', JSON.stringify(pkg));
  }
}
