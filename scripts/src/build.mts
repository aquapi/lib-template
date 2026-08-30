import pkg from '../../package.json' with { type: 'json' };

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';

import { measureAsyncTask } from './lib/tasks.mts';

import buildConfig from '../config/build.mts';

import { enableCompileCache } from 'node:module';
enableCompileCache();

if (process.argv[2] === 'help') {
  console.info('Build package to ./dist');
} else {
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

    measureAsyncTask('write ./dist/package.json', () =>
      writeFile('dist/package.json', JSON.stringify(pkg)),
    );
  }

  // Transform files
  (async () => {
    const recursively = { recursive: true } as const,
      beforeWriteTasks: Promise<string[] | void>[] = [];

    /**
     * Pick up the files recursively, queue `mkdir` tasks to create subdirectories and `transform` tasks to transform files concurrently.
     * @returns whether the callee should create the directory, if `false` it means the caller already creates the subdirectory recursively.
     */
    const recursiveTransform = async (srcdir: string, outdir: string): Promise<boolean> => {
      let hasFiles = false,
        subdirReads: Promise<boolean>[] = [];

      for (const dirent of await readdir(srcdir, { withFileTypes: true })) {
        const direntName = dirent.name;
        if (direntName === 'node_modules' || direntName.startsWith('.')) continue;

        if (dirent.isFile() || dirent.isSymbolicLink()) {
          hasFiles = true;

          if (direntName.endsWith('.mts')) {
            const srcPath = srcdir + direntName,
              // index.
              outPathWithoutExt = outdir + direntName.slice(0, -3);

            beforeWriteTasks.push(
              measureAsyncTask(`transform ${srcPath}`, async () => {
                const transformed = buildConfig.transform(
                  srcPath,
                  await readFile(srcPath, { encoding: 'utf8' }),
                );

                return transformed.declaration != null
                  ? [
                    outPathWithoutExt + 'mjs',
                    transformed.code,
                    outPathWithoutExt + 'd.mts',
                    transformed.declaration,
                  ]
                  : [outPathWithoutExt + 'mjs', transformed.code];
              }),
            );
          }
        } else if (dirent.isDirectory()) {
          const subpath = direntName + '/';
          subdirReads.push(recursiveTransform(srcdir + subpath, outdir + subpath));
        }
      }

      // Avoids a lot of syscalls if the directories only contain directories or is empty
      if (subdirReads.length > 0)
        for (
          let i = 0, dirNotCreatedResults = await Promise.all(subdirReads);
          i < dirNotCreatedResults.length;
          i++
        )
          // Subdir reads already created the directory
          if (!dirNotCreatedResults[i]) return false;

      if (hasFiles) {
        beforeWriteTasks.push(
          // @ts-ignore
          measureAsyncTask(`mkdir ${outdir}`, () => mkdir(outdir, recursively)),
        );

        return false;
      }

      return true;
    };
    if (await recursiveTransform('./src/', './dist/'))
      await mkdir('dist', recursively);

    const writeTasks: Promise<void>[] = [];
    for (const result of await Promise.all(beforeWriteTasks))
      if (result != null)
        for (let i = 0; i < result.length; i += 2)
          writeTasks.push(
            measureAsyncTask(`write ${result[i]}`, () => writeFile(result[i], result[i + 1])),
          );

    await Promise.all(writeTasks);
  })();
}
