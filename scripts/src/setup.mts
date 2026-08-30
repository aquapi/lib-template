import pkg from '../../package.json' with { type: 'json' };

import { measureSyncTask } from './lib/tasks.mts';
import envConfig from '../config/env.mts';

import { globSync, writeFileSync } from 'node:fs';
import exec from './lib/exec.mts';

import { enableCompileCache } from 'node:module';
enableCompileCache();

// Load scripts
{
  // @ts-ignore
  const scripts: Record<string, string> = (pkg.scripts ||= {});

  for (const file of globSync('*.mts', { cwd: 'scripts/src' })) {
    const scriptName = file.slice(0, -4);
    scripts[scriptName] = envConfig.runtime.run('scripts/src/' + file).join(' && ');
    console.info('added script:', scriptName);
  }
}

measureSyncTask('update package.json', () => {
  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
});

envConfig.packageManager.init().forEach(exec);
