import { existsSync, rmSync, readFileSync } from 'node:fs';
import { minifySync } from '@swc/core';
import { transformSync } from 'oxc-transform';
import pkg from '../package.json';
import { cp, LIB, ROOT, SOURCE } from './utils.ts';
import { basename, dirname } from 'node:path/posix';

// Remove old content
if (existsSync(LIB)) rmSync(LIB, { recursive: true });

// @ts-ignore
const exports = (pkg.exports = {} as Record<string, string>);

for (const path of new Bun.Glob('**/*.ts').scanSync(SOURCE)) {
  const pathNoExt = path.slice(0, path.lastIndexOf('.') >>> 0);
  const pathName = basename(pathNoExt);

  const transformed = transformSync(
    path,
    readFileSync(`${SOURCE}/${path}`, { encoding: 'utf8' }),
    {
      sourceType: 'module',
      typescript: {
        rewriteImportExtensions: true,
        declaration: {
          stripInternal: true,
        },
      },
      lang: 'ts',
    }
  );

  const hasCode = transformed.code && transformed.code.trim() !== 'export {};';
  const hasDecl = transformed.declaration && transformed.declaration.trim() !== 'export {};';

  hasCode &&
    Bun.write(
      `${LIB}/${pathNoExt}.js`,
      minifySync(transformed.code, {
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
      }).code,
    );

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
          [pathName.slice(1)]: sourcePath
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
cp(ROOT, LIB, 'README.md');
