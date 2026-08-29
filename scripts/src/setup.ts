import pkg from '../../package.json' with { type: 'json' };
import { measureSyncTask } from './lib/tasks.ts';

import { globSync, writeFileSync } from 'node:fs';

import envConfig from '../config/env.ts';

// Load scripts
{
  // @ts-ignore
  const scripts: Record<string, string> = (pkg.scripts ||= {});

  for (const file of globSync('*.ts', { cwd: 'scripts/src' })) {
    const realPath = 'scripts/src/' + file,
      scriptName = file.slice(0, -3);

    scripts[scriptName] = envConfig.run_script(JSON.stringify(realPath));
    console.info('added script:', scriptName);
  }
}

measureSyncTask('update package.json', () => {
  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
});
