import pkg from '../../package.json' with { type: 'json' };
import { measureSyncTask } from './lib/tasks.ts';

import { globSync, writeFileSync } from 'node:fs';

// Load scripts
{
  // @ts-ignore
  const scripts: Record<string, string> = (pkg.scripts ||= {});

  for (const file of globSync('*.ts', { cwd: 'scripts/src' })) {
    const scriptName = file.slice(0, -3);
    console.info('added script:', scriptName);
    scripts[file.slice(0, -3)] = 'node ' + JSON.stringify('scripts/src/' + file);
  }
}

measureSyncTask('update package.json', () => {
  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
});
