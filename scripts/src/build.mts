import pkg from '../../package.json' with { type: 'json' };

import { readFile, writeFile, readdir, mkdir, link } from 'node:fs/promises';

import { measureAsyncTask } from './lib/tasks.mts';
import buildConfig from '../config/build.mts';
import envConfig from '../config/env.mts';

import { glob } from 'tinyglobby';

import { enableCompileCache } from 'node:module';
enableCompileCache();

if (process.argv[2] === 'help') {
  console.info('Build package to ./dist');
} else {
  const recursively = { recursive: true } as const;

  await Promise.all([
    measureAsyncTask('link assets', async () =>
      Promise.all(
        (await glob(buildConfig.assets)).map((file) => {
          const finalPath = './dist/' + file;

          return measureAsyncTask(`symlink ./${file} to ${finalPath}`, async () => {
            await mkdir(finalPath.slice(0, finalPath.lastIndexOf('/')), recursively);
            return link(file, finalPath);
          });
        }),
      ),
    ),

    measureAsyncTask('transform', async () => {
      // [path, content, ...]
      const writeContents: string[] = [];

      {
        /**
         * Pick up the files recursively, queue `mkdir` tasks to create subdirectories and `transform` tasks to transform files concurrently.
         * @returns whether the callee should create the directory, if `false` it means the caller already creates the subdirectory recursively.
         */
        const recursiveTransform = async (
          srcdir: string,
          outdir: string,
          tasks: Promise<any>[],
        ): Promise<boolean> => {
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

                tasks.push(
                  measureAsyncTask(`transform ${srcPath}`, async () => {
                    const transformed = buildConfig.transform(
                      srcPath,
                      await readFile(srcPath, { encoding: 'utf8' }),
                    );

                    writeContents.push(outPathWithoutExt + 'mjs', transformed.code);
                    if (transformed.declaration != null)
                      writeContents.push(outPathWithoutExt + 'd.mts', transformed.declaration);
                  }),
                );
              }
            } else if (dirent.isDirectory()) {
              const subpath = direntName + '/';
              subdirReads.push(recursiveTransform(srcdir + subpath, outdir + subpath, tasks));
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
            tasks.push(
              // @ts-ignore
              measureAsyncTask(`mkdir ${outdir}`, () => mkdir(outdir, recursively)),
            );

            return false;
          }

          return true;
        };

        const beforeWriteTasks: Promise<void>[] = [];
        if (await recursiveTransform('./src/', './dist/', beforeWriteTasks))
          await mkdir('dist', recursively);
        await Promise.all(beforeWriteTasks);
      }

      {
        const halfLen = writeContents.length >>> 1,
          writeTasks: Promise<void>[] = new Array(halfLen);

        for (let i = 0; i < halfLen; i++)
          writeTasks[i] = measureAsyncTask(`write ${writeContents[i << 1]}`, () =>
            writeFile(writeContents[i << 1], writeContents[(i << 1) | 1]),
          );

        await Promise.all(writeTasks);
      }
    }),

    measureAsyncTask('create & optimize package.json', () => {
      // @ts-ignore
      delete pkg.devDependencies;
      // @ts-ignore
      delete pkg.trustedDependencies;
      // @ts-ignore
      delete pkg.packageManager;

      {
        let keyCount = 0,
          // @ts-ignore
          scripts: Record<string, string> = (pkg.scripts ||= {}),
          scriptRegex = new RegExp(`^(?:pre|post)?(?:${buildConfig.scripts.join('|')})$`);

        for (const key in scripts) {
          if (scriptRegex.test(key)) keyCount++;
          else delete scripts[key];
        }

        // @ts-ignore
        if (keyCount === 0) delete pkg.scripts;
      }

      return writeFile('dist/package.json', JSON.stringify(pkg));
    }),
  ]);

  envConfig.packageManager.devInstall();
}
