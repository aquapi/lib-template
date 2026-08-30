import envConfig from '../config/env.mts';
import exec from './lib/exec.mts';

if (process.argv[2] === 'help') {
  console.info('publish built package in ./dist');
} else {
  envConfig.packageManager.publish('./dist').forEach(exec);
}
