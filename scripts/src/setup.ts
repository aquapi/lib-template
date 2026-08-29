import pkg from '../../package.json' with { type: 'json' };

import { measureSyncTask } from './lib/tasks.ts';
import envConfig from '../config/env.ts';

import { globSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Load scripts
{
  // @ts-ignore
  const scripts: Record<string, string> = (pkg.scripts ||= {});

  for (const file of globSync('*.ts', { cwd: 'scripts/src' })) {
    const scriptName = file.slice(0, -3);
    scripts[scriptName] = envConfig.runtime.run('scripts/src/' + file).join(' && ');
    console.info('added script:', scriptName);
  }
}

measureSyncTask('update package.json', () => {
  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
});

for (const cmd of envConfig.packageManager.init())
  measureSyncTask(cmd, () => {
    execSync(cmd, {
      stdio: 'inherit',
    });
  });
