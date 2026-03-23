import { basename, dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

import { minifySync, type JsMinifyOptions } from '@swc/core';
import { transformSync, type TransformOptions } from 'oxc-transform';

import { LIB, SOURCE } from './constants.ts';

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

export const buildSync = (
  pathFromSource: string,
  exports: Record<string, string | Record<string, string>>,
) => {
  const pathNoExt = pathFromSource.slice(0, pathFromSource.lastIndexOf('.') >>> 0);
  const pathName = basename(pathNoExt);

  const transformed = transformSync(
    pathFromSource,
    readFileSync(join(SOURCE, pathFromSource), { encoding: 'utf8' }),
    TRANSFORM_OPTIONS,
  );

  const hasCode = transformed.code && transformed.code.trim() !== 'export {};';
  const hasDecl = transformed.declaration && transformed.declaration.trim() !== 'export {};';

  hasCode && Bun.write(`${LIB}/${pathNoExt}.js`, minifySync(transformed.code, MINIFY_OPTIONS).code);

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
};
