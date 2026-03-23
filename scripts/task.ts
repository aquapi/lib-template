import { fork } from 'node:child_process';
import { join } from 'node:path';

import { LIB, SCRIPTS, SOURCE, TESTS } from './lib/constants.ts';
import { fmt } from './lib/fmt.ts';

//
// TYPES
//
type Primitive = 'string' | 'number' | 'bool';
interface Task {
  description: string;
  args: Record<
    string,
    {
      type: Primitive | `${Primitive}[]` | `?${Primitive}` | (string & {});
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
  test: {
    description: 'Run tests.',
    args: {
      '--watch': {
        type: '?bool',
        description: 'Watch tests.'
      },
      '--target': {
        type: '?string',
        description: 'Test target. Run all target tests when not specified.'
      },
      globs: {
        type: 'string[]',
        description: `Files to test in ${fmt.relativePath(TESTS + '/[target]')}. Defaults to "**/*.test.ts".`,
      },
    }
  }
};

{
  const printHelp = (name: string, task: Task) => {
    const entries = Object.entries(task.args);

    console.log(
      `  ${fmt.h2(name)} ${entries
        .map(([k, v]) => fmt.h1(v.type.endsWith('[]') ? `[...${k}]` : `[${k}]`))
        .join(' ')}: ${task.description}`,
    );

    for (const entry of entries) {
      console.log(`  * ${fmt.h1(entry[0] + ': ' + entry[1].type)}`);
      console.log(`  - ${entry[1].description}`);
    }
  }

  //
  // MAIN
  //
  const task = process.argv[2];
  if (task == null || !(task in TASKS)) {
    if (task === 'help') {
      const askedTask = process.argv[3];
      if (askedTask != null) {
        if (askedTask in TASKS) {
          printHelp(askedTask, TASKS[askedTask]);
          process.exit(0);
        } else {
          console.log('unknown task:', fmt.h2(askedTask));
          console.log('available tasks:', Object.keys(TASKS).map(fmt.h2).join(', '));
          process.exit(1);
        }
      }
    }

    printHelp('help', {
      description: 'Print help menu.',
      args: {
        task: {
          type: '?string',
          description: 'Print help menu of the specified task. Print all tasks by default.'
        }
      }
    });
    for (const name in TASKS)
      printHelp(name, TASKS[name]);

    process.exit(0);
  }

  fork(join(SCRIPTS, task + '.ts'), process.argv.slice(3), {
    stdio: 'inherit',
  });
}
