import pkg from '../../package.json' with { type: 'json' };

import { transformSync, type TransformOptions } from 'oxc-transform';

import path from 'node:path';
import { existsSync, globSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile, writeFile, link } from 'node:fs/promises';

import { measureAsyncTask, measureSyncTask } from './lib/tasks.ts';

import buildConfig from '../config/build.ts';
export interface BuildConfig {
  /**
   * Output directory.
   */
  output: string;

  /**
   * Asset patterns to include in package.
   */
  assets: ('LICENSE' | (string & {}))[];

  /**
   * Scripts to include.
   */
  scripts: string[];

  /**
   * File extensions to transform in `src`.
   */
  exts: {
    [K in 'default' | 'types' | 'bun' | 'node' | 'deno' | 'workerd' | 'browser']?: string;
  };

  /**
   * Transform options.
   */
  transform: TransformOptions;
}

if (process.argv[2] === 'help')
  console.info('Build package to', buildConfig.output);
else {
  // Create output directory
  mkdirSync(buildConfig.output, { recursive: true });

  // Link assets
  await Promise.all(
    buildConfig.assets.flatMap((pattern) =>
      globSync(pattern).map((file) =>
        measureAsyncTask(`link asset ./${path.relative('.', file)}`, (label) => {
          const outputFile = path.join(buildConfig.output, file);
          if (existsSync(outputFile)) {
            console.log(label, 'symlink already existed');
          } else {
            mkdirSync(path.dirname(outputFile), { recursive: true });
            return link(file, outputFile);
          }
        }),
      ),
    ),
  );

  // Transform files
  {
    // @ts-ignore
    const exports: Record<string, string | Record<string, string>> = (pkg.exports ||= {}),
      setExport = (target: string, exportPath: string, realPath: string) => {
        const oldExports = exports[exportPath];

        // Default export
        if (typeof oldExports === 'string') {
          if (target === 'default') exports[exportPath] = realPath;
          else
            exports[exportPath] = {
              default: oldExports,
              [target]: realPath,
            };
        }
        // No export exists
        else if (oldExports == null) {
          exports[exportPath] = target === 'default' ? realPath : { [target]: realPath };
        }
        // Different targets export
        else {
          // @ts-ignore
          exports[exportPath][target] = realPath;
        }
      },
      exts = Object.entries(buildConfig.exts).sort((a, b) => b.length - a.length);

    let pendingFilePaths = globSync('**/*', { cwd: 'src' }),
      nextPendingFilePaths: string[] = [];

    // Check each target
    for (const [target, ext] of exts) {
      // If no file is pending
      if (pendingFilePaths.length === 0) break;

      const subExt = ext.slice(0, ext.lastIndexOf('.') + 1),
        outputExt = subExt + 'mjs';

      await Promise.all(
        pendingFilePaths.map((filePath) => {
          if (filePath.endsWith(ext))
            return measureAsyncTask(`transform ./src/${filePath}`, async () => {
              const pathWithoutExt = filePath.slice(0, filePath.length - ext.length);

              const transformed = transformSync(
                filePath,
                await readFile('src/' + filePath, { encoding: 'utf8' }),
                buildConfig.transform,
              );

              // Whether the code is not empty
              if (transformed.code && transformed.code.trim() !== 'export {};') {
                const outputPath = './' + pathWithoutExt + outputExt;
                await writeFile(path.join(buildConfig.output, outputPath), transformed.code);

                // Set export only for index.ts types of file
                if (pathWithoutExt.endsWith('/index'))
                  setExport(target, './' + pathWithoutExt.slice(6), outputPath);
                else if (pathWithoutExt === 'index') setExport(target, '.', outputPath);
              }

              // Whether the declaration is not empty
              if (transformed.declaration)
                await writeFile(
                  path.join(buildConfig.output, pathWithoutExt + subExt + 'd.ts'),
                  transformed.declaration!,
                );
            });

          // Mark as not consumed
          nextPendingFilePaths.push(filePath);
        }),
      );

      // Some paths match
      if (pendingFilePaths.length > nextPendingFilePaths.length)
        setExport(target, './*', './*' + outputExt);

      // Swap to paths that were not consumed
      pendingFilePaths = nextPendingFilePaths;
      nextPendingFilePaths = [];
    }
  }

  // Make output package.json smaller
  {
    // @ts-ignore
    delete pkg.devDependencies;
    // @ts-ignore
    delete pkg.trustedDependencies;
    // @ts-ignore
    delete pkg.packageManager;

    {
      let keyCount = 0,
        // @ts-ignore
        scripts: Record<string, string> = (pkg.scripts ||= {});

      for (const key in scripts) {
        if (
          // Keep install scripts
          key !== 'preinstall' &&
          key !== 'install' &&
          key !== 'postinstall' &&
          key !== 'prepare' &&
          !buildConfig.scripts.includes(key)
        )
          delete scripts[key];
        else keyCount++;
      }

      // @ts-ignore
      if (keyCount === 0) delete pkg.scripts;
    }

    measureSyncTask('write ./package.json', () =>
      writeFileSync(path.join(buildConfig.output, 'package.json'), JSON.stringify(pkg)),
    );
  }
}
