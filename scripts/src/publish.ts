import { execSync } from 'node:child_process';

import buildConfig from '../config/build.ts';
import envConfig from '../config/env.ts';
import { measureSyncTask } from './lib/tasks.ts';

if (process.argv[2] === 'help') {
  console.info('publish built package in', buildConfig.output);
} else {
  for (const cmd of envConfig.packageManager.publish(buildConfig.output))
    measureSyncTask(cmd, () => {
      execSync(cmd, {
        stdio: 'inherit',
      });
    });
}
