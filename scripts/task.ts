import { fork } from 'node:child_process';
import { join } from 'node:path';

import { BUILD_FILES_PATTERN, LIB, SCRIPTS, SOURCE } from './lib/constants.ts';
import { fmt } from './lib/fmt.ts';

//
// TYPES
//
interface Task {
  description: string;
  args: Record<
    string,
    {
      type:
        | 'string'
        | 'number'
        | '?bool'
        | 'string[]'
        | 'number[]'
        | '?string'
        | '?number'
        | (string & {});
      description: string;
      flag?: true;
    }
  >;
}

//
// CONFIG
//
const TASKS: Record<string, Task> = {
  build: {
    description: `Build files matching ${fmt.glob(BUILD_FILES_PATTERN)} in ${fmt.relativePath(SOURCE)} to ${fmt.relativePath(LIB)}.`,
    args: {},
  },
  test: {
    description: `Run tests.`,
    args: {
      target: {
        type: 'string[]',
        description: 'Target tests to run. Run all tests by default.',
      },
    },
  },
  dev: {
    description: 'Watch for source file and test changes.',
    args: {},
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
        description: `Files to scan in ${fmt.relativePath(LIB)} to include in the build. Defaults to ${fmt.glob('**/*.js')}.`,
      },
    },
  },
};

{
  //
  // MAIN
  //
  const printHelp = (name: string, task: Task) => {
    const entries = Object.entries(task.args);

    console.log(
      `\n  ${fmt.pc.bold('bun task')} ${fmt.name(name)}${entries
        .map(([k, v]) => {
          v.type.endsWith('[]') ? (k = '...' + k) : v.flag && (k = '--' + k);
          return ' ' + fmt.pc.bold(`[${k}]`);
        })
        .join('')}: ${task.description}`,
    );

    for (const entry of entries)
      console.log(
        `    ${fmt.pc.bold(fmt.pc.dim(entry[0]))}: ${fmt.pc.bold(fmt.pc.yellowBright(entry[1].type))}: ${entry[1].description}`,
      );
  };

  const task = process.argv[2];
  if (task == null || !(task in TASKS)) {
    if (task === 'help') {
      const askedTask = process.argv[3];
      if (askedTask != null) {
        if (askedTask in TASKS) {
          printHelp(askedTask, TASKS[askedTask]);
          process.exit(0);
        } else {
          console.log('unknown task:', fmt.name(askedTask));
          console.log('available tasks:', Object.keys(TASKS).map(fmt.name).join(', '));
          process.exit(1);
        }
      }
    }

    // Print all tasks
    printHelp('help', {
      description: 'Print help menu.',
      args: {
        task: {
          type: '?string',
          description: 'Print help menu of the specified task. Print all tasks by default.',
        },
      },
    });
    for (const name in TASKS) printHelp(name, TASKS[name]);

    process.exit(0);
  }

  fork(join(SCRIPTS, 'src', task + '.ts'), process.argv.slice(3), {
    stdio: 'inherit',
  });
}
