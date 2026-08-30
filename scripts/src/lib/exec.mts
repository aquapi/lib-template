import { execSync } from 'node:child_process';
import { measureSyncTask } from './tasks.mts';

const options = {
    stdio: 'inherit',
  } as const,
  exec = (cmd: string) =>
    measureSyncTask(`run \`${cmd}\``, () => {
      execSync(cmd, options);
    });

export default exec;
