import { write, file, $, type ShellOutput } from 'bun';
import { resolve, join } from 'node:path/posix';

export const SCRIPTS = import.meta.dir;
export const ROOT = resolve(SCRIPTS, '..');
export const SOURCE = ROOT + '/src';
export const LIB = ROOT + '/lib';
export const BENCH = ROOT + '/bench';

export const cpToLib = (path: string) => write(join(LIB, path), file(path));
export const exec = (...args: Parameters<typeof $>) => $(...args).catch((err: ShellOutput) => process.stderr.write(err.stderr as any));
export const cd = (dir: string) => $.cwd(dir);
