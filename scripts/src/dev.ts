import { watch } from 'chokidar';
import { SOURCE } from '../lib/constants.ts';
import { buildSourceSync, modifyPackageJson, removeSourceSync } from '../lib/build.ts';

{
  //
  // MAIN
  //
  const glob = new Bun.Glob('**/*.ts');

  {
    //
    // BUILD
    //
    const modifiers = {
      exports: {},
      devDependencies: undefined,
      scripts: undefined,
    };

    watch('.', {
      ignored: (path, stats) => !stats?.isFile() || !glob.match(path),
      cwd: SOURCE,
      interval: 100,
    })
      .on('add', (path) => {
        buildSourceSync(path, modifiers.exports);
        modifyPackageJson(modifiers);
      })
      .on('change', (path) => {
        buildSourceSync(path, {});
      })
      .on('unlink', (path) => {
        removeSourceSync(path, modifiers.exports);
        modifyPackageJson(modifiers);
      })
      .on('error', (e) => {
        console.error(e);
      });
  }
}
