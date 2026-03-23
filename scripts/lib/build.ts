import { basename, dirname, join } from 'node:path';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

import { minifySync, type JsMinifyOptions } from '@swc/core';
import { transformSync, type TransformOptions } from 'oxc-transform';

import { LIB, SOURCE } from './constants.ts';
import { fmt } from './fmt.ts';

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

export const buildSourceSync = (
  pathFromSource: string,
  exports: Record<string, string | Record<string, string>>,
) => {
  let time = Bun.nanoseconds();

  const fullPath = join(SOURCE, pathFromSource);
  try {
    const pathNoExt = pathFromSource.slice(0, pathFromSource.lastIndexOf('.') >>> 0);
    const pathName = basename(pathNoExt);

    const transformed = transformSync(
      pathFromSource,
      readFileSync(fullPath, { encoding: 'utf8' }),
      TRANSFORM_OPTIONS,
    );

    const hasCode = transformed.code && transformed.code.trim() !== 'export {};';
    const hasDecl = transformed.declaration && transformed.declaration.trim() !== 'export {};';

    hasCode &&
      writeFileSync(
        join(LIB, pathNoExt + '.js'),
        minifySync(transformed.code, MINIFY_OPTIONS).code,
      );
    hasDecl && writeFileSync(join(LIB, pathNoExt + '.d.ts'), transformed.declaration!);

    if (hasCode || hasDecl) {
      const isRuntimeKey = pathName.startsWith('_');

      const exportPath =
        pathName === 'index' || isRuntimeKey // Runtime key
          ? dirname(pathNoExt)
          : pathNoExt;
      const sourcePath = './' + pathNoExt + (hasCode ? '.js' : '.d.ts');

      if (isRuntimeKey) {
        const runtimeKey = pathName.slice(1);

        if (typeof exports[exportPath] === 'string') {
          console.error(`Change ${exportPath}/index to ${exportPath}/_default instead!`);
          process.exit(1);
        } else
          // @ts-ignore
          (exports[exportPath] ??= {})[runtimeKey] = sourcePath;
      } else exports[exportPath] = sourcePath;
    }
  } finally {
    time = Bun.nanoseconds() - time;
    console.log(fmt.success('+ ' + fmt.relativePath(fullPath)) + ':', fmt.duration(time));
  }
};

export const removeSourceSync = (
  pathFromSource: string,
  exports: Record<string, string | Record<string, string>>,
) => {
  let time = Bun.nanoseconds();

  try {
    const pathNoExt = pathFromSource.slice(0, pathFromSource.lastIndexOf('.') >>> 0);
    const pathName = basename(pathNoExt);

    let hasCode: boolean;
    try {
      rmSync(join(LIB, pathNoExt + '.js'));
      hasCode = true;
    } catch {
      hasCode = false;
    }

    let hasDecl: boolean;
    try {
      rmSync(join(LIB, pathNoExt + '.d.ts'));
      hasDecl = true;
    } catch {
      hasDecl = false;
    }

    if (hasCode || hasDecl) {
      const isRuntimeKey = pathName.startsWith('_');

      const exportPath =
        pathName === 'index' || isRuntimeKey // Runtime key
          ? dirname(pathNoExt)
          : pathNoExt;

      if (isRuntimeKey && Object.keys(exports[exportPath]).length > 1) {
        const runtimeKey = pathName.slice(1);
        // @ts-ignore
        delete exports[exportPath][runtimeKey];
      } else delete exports[exportPath];
    }
  } finally {
    time = Bun.nanoseconds() - time;
    console.log(
      fmt.error('- ' + fmt.relativePath(join(SOURCE, pathFromSource))) + ':',
      fmt.duration(time),
    );
  }
};
