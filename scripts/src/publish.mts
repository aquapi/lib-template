import envConfig from '../config/env.mts';

if (process.argv[2] === 'help') {
  console.info('publish built package in ./dist');
} else {
  envConfig.packageManager.publish();
}
