import { writeFileSync } from 'node:fs';

import pkg from '../../package.json' with { type: 'json' };

import { measureSyncTask } from './lib/tasks.mts';
import envConfig from '../config/env.mts';

import { globSync } from 'tinyglobby';

import { enableCompileCache } from 'node:module';
enableCompileCache();

measureSyncTask('update package.json scripts', () => {
  {
    // @ts-ignore
    const scripts: Record<string, string> = (pkg.scripts ||= {});

    for (const file of globSync('*.mts', { cwd: 'scripts/src' })) {
      const scriptName = file.slice(0, -4);
      scripts[scriptName] = envConfig.runtime.runScript('scripts/src/' + file);
      console.info('added script:', scriptName);
    }
  }

  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
});

envConfig.packageManager.init();
