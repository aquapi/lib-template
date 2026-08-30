import pkg from '../../package.json' with { type: 'json' };

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';

import { measureAsyncTask, measureSyncTask } from './lib/tasks.ts';

import buildConfig from '../config/build.ts';

if (process.argv[2] === 'help') {
  console.info('Build package to ./dist');
} else {
  const recursiveSearch = { recursive: true } as const;

  rmSync('dist', recursiveSearch);
  mkdirSync('dist', recursiveSearch);

  {
    const transformTasks: Promise<void>[] = [],
      writeTasks: Promise<void>[] = [],
      addWriteTask = (file: string, content: string) => {
        writeTasks.push(measureAsyncTask(`write ${file}`, () => writeFile(file, content)));
      };;

    /**
     * Pick up the files recursively, create subdirectories in `outdir` to mirror `dir` if necessary.
     * @returns whether the callee should create the directory, if `false` it means the caller already creates the subdirectory recursively.
     */
    const recursiveTransform = async (
      srcdir: string,
      outdir: string
    ): Promise<boolean> => {
      let hasFiles = false,
        subdirReads: Promise<boolean>[] = [];

      for (const dirent of await readdir(srcdir, { withFileTypes: true })) {
        const direntName = dirent.name;
        if (direntName === 'node_modules' || direntName.startsWith('.')) continue;

        if (dirent.isFile() || dirent.isSymbolicLink()) {
          hasFiles = true;

          if (direntName.endsWith('.ts')) {
            const srcPath = srcdir + direntName,
              // index.
              outPathWithoutExt = outdir + direntName.slice(0, -2);

            transformTasks.push(
              measureAsyncTask(`transform ${srcPath}`, async () => {
                const transformed = buildConfig.transform(
                  srcPath,
                  await readFile(srcPath, { encoding: 'utf8' }),
                );

                addWriteTask(outPathWithoutExt + 'mjs', transformed.code);
                if (transformed.declaration != null)
                  addWriteTask(outPathWithoutExt + 'd.mts', transformed.declaration);
              })
            );
          }
        } else if (dirent.isDirectory()) {
          const subpath = direntName + '/';
          subdirReads.push(recursiveTransform(srcdir + subpath, outdir + subpath));
        }
      }

      // Avoids a lot of syscalls if the directories only contain directories or is empty
      if (subdirReads.length > 0)
        for (let i = 0, dirNotCreatedResults = await Promise.all(subdirReads); i < dirNotCreatedResults.length; i++)
          // Subdir reads already created the directory
          if (!dirNotCreatedResults[i]) return false;

      if (hasFiles) {
        await mkdir(outdir, recursiveSearch);
        return false;
      }

      return true;
    };
    await recursiveTransform('./src/', './dist/');

    await Promise.all(transformTasks);
    await Promise.all(writeTasks);
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

    measureSyncTask('write ./dist/package.json', () =>
      writeFileSync('dist/package.json', JSON.stringify(pkg)),
    );
  }
}
