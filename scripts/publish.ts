import { cd, cpToLib, exec, LIB } from './utils';
import pkg from '../package.json';

cpToLib('README.md');

{
  delete pkg.devDependencies;
  delete pkg.scripts;
  Bun.write(LIB + '/package.json', JSON.stringify(pkg, null, 2));
}

cd(LIB);

if (process.argv[2] !== '--dry')
  await exec`bun publish --access=public`;
