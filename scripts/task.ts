import { fork } from 'node:child_process';
import { join } from 'node:path';

import { LIB, SCRIPTS, SOURCE } from './lib/constants.ts';
import { fmt } from './lib/fmt.ts';

//
// TYPES
//
type Primitive = 'string' | 'number' | 'boolean';
interface Task {
  description: string;
  args: Record<
    string,
    {
      type: Primitive | `${Primitive}[]` | `?${Primitive}`;
      description: string;
    }
  >;
}

//
// CONFIG
//
const TASKS: Record<string, Task> = {
  build: {
    description: `Build files in ${fmt.relativePath(SOURCE)} to ${fmt.relativePath(LIB)}.`,
    args: {
      globs: {
        type: 'string[]',
        description: `Files to scan in ${fmt.relativePath(SOURCE)} to include in the build. Defaults to "**/*.ts".`,
      },
    },
  },
  publish: {
    description: `Publish ${fmt.relativePath(LIB)} to npm.`,
    args: {
      otp: {
        type: '?string',
        description: 'OTP code to authenticate. Will be prompted if ignored.',
      },
    },
  },
  'report-size': {
    description: `Report ${fmt.relativePath(LIB)} files size.`,
    args: {
      globs: {
        type: 'string[]',
        description: `Files to scan in ${fmt.relativePath(LIB)} to include in the build. Defaults to "**/*.js".`,
      },
    },
  },
};

{
  //
  // MAIN
  //
  const task = process.argv[2];
  if (task == null || !(task in TASKS)) {
    Object.entries(TASKS).forEach(([name, task]) => {
      const entries = Object.entries(task.args);

      console.log(
        `  ${fmt.h2(name)} ${entries
          .map(([k, v]) => fmt.h1(v.type.endsWith('[]') ? `[...${k}]` : `[${k}]`))
          .join(' ')}: ${task.description}`,
      );

      for (const entry of entries)
        console.log(`  * ${fmt.h1(entry[0] + ': ' + entry[1].type)}: ${entry[1].description}`);
    });

    process.exit(0);
  }

  fork(join(SCRIPTS, task + '.ts'), process.argv.slice(3), {
    stdio: 'inherit',
  });
}
