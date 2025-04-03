/// <reference types='bun-types' />
import { existsSync, rmSync } from 'node:fs';
import * as latch from 'ciorent/latch';

import { transpileDeclaration } from 'typescript';
import tsconfig from '../tsconfig.json';
import pkg from '../package.json';
import { cp, LIB, ROOT, SOURCE } from './utils.js';

// Remove old content
if (existsSync(LIB))
  rmSync(LIB, { recursive: true });

// Transpile files concurrently
const transpiler = new Bun.Transpiler({
  loader: 'ts',
  target: 'node',

  // Lighter output
  minifyWhitespace: true,
  treeShaking: true,
  trimUnusedImports: true
});

// @ts-ignore
const exports = pkg.exports = {} as Record<string, string>;

(async () => {
  const promises: Promise<any>[] = [];

  for (const path of new Bun.Glob('**/*.ts').scanSync(SOURCE)) {
    promises.push(
      (async () => {
        const pathNoExt = path.substring(0, path.lastIndexOf('.') >>> 0);

        const buf = await Bun.file(`${SOURCE}/${path}`).text();
        Bun.write(`${LIB}/${pathNoExt}.d.ts`, transpileDeclaration(buf, tsconfig as any).outputText);

        const transformed = await transpiler.transform(buf);
        if (transformed !== '')
          Bun.write(`${LIB}/${pathNoExt}.mjs`, transformed.replace(/const /g, 'let '));

        exports[
          pathNoExt === 'index'
            ? '.'
            : './' + (pathNoExt.endsWith('/index')
              ? pathNoExt.slice(0, -6)
              : pathNoExt
            )
        ] = './' + pathNoExt + (transformed === '' ? '.d.ts' : '.mjs');
      })()
    );
  }

  await Promise.all(promises);

  delete pkg.devDependencies;
  delete pkg.scripts;

  Bun.write(LIB + '/package.json', JSON.stringify(pkg, null, 2));
  cp(ROOT, LIB, 'README.md');
})();
