import { execSync } from 'node:child_process';

import envConfig from '../config/env.ts';
import { measureSyncTask } from './lib/tasks.ts';

if (process.argv[2] === 'help') {
  console.info('publish built package in ./dist');
} else {
  for (const cmd of envConfig.packageManager.publish('./dist'))
    measureSyncTask(cmd, () => {
      execSync(cmd, {
        stdio: 'inherit',
      });
    });
}
