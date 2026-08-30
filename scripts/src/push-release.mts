import pkg from '../../package.json';

import exec from './lib/exec.mts';
import cmd from './lib/cmd.mts';

import { enableCompileCache } from 'node:module';
enableCompileCache();

if (process.argv[2] === 'help') {
  console.info(
    'Tag and push commits with current version in ./package.json, which triggers ./.github/workflows/publish.yml workflow.',
  );
} else {
  exec(cmd`git tag ${pkg.version}`);
  exec(cmd`git push`);
}
