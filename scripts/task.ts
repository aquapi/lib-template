import { SCRIPTS } from './utils.ts';
import { fork } from 'node:child_process';

const task = process.argv[2];
if (task == null) {
  console.log(
    'available tasks:',
    [...new Bun.Glob('**/*.ts').scanSync(SCRIPTS)]
      .map((p) => p.slice(0, p.lastIndexOf('.') >>> 0))
      .join(', '),
  );
  process.exit(0);
}

fork(SCRIPTS + '/' + task + '.ts', process.argv.slice(3), {
  stdio: 'inherit',
});
