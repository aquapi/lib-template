import { join, resolve, relative } from 'node:path/posix';
import { $, file, write } from 'bun';
import pc from 'picocolors';

//
// FILE
//
export const SCRIPTS = import.meta.dir;
export const ROOT = resolve(SCRIPTS, '..');
export const SOURCE = ROOT + '/src';
export const LIB = ROOT + '/lib';
export const BENCH = ROOT + '/bench';
export const EXAMPLES = ROOT + '/examples/src';

export const cp = (from: string, to: string, path: string) =>
  write(join(to, path), file(join(from, path)));
export const exec = (...args: Parameters<typeof $>) =>
  $(...args).catch((err) => process.stderr.write(err.stderr as any));
export const cd = (dir: string) => $.cwd(dir);

//
// MATH
//
export const math = {
  truncate: (n: number): number => (n < 0.01 ? n : Math.round(n * 100) / 100),
};

// UNIT
interface UnitData {
  units: string[];
  divs: number[];
}

const unitSelectId = (u: UnitData, value: number): number => {
  let idx = 0;
  while (idx < u.units.length - 1 && value > (u.divs[idx + 1] * 3) / 2) idx++;
  return idx;
};

const unitTruncateTo = (u: UnitData, id: number, value: number): number =>
  math.truncate(value / u.divs[id]);
const unitConvertTo = (u: UnitData, id: number, value: number): string =>
  unitTruncateTo(u, id, value) + u.units[id];
export const unitConvertAuto = (u: UnitData, value: number): string =>
  unitConvertTo(u, unitSelectId(u, value), value);

const UNIT_TIME: UnitData = {
  units: ['ns', 'µs', 'ms', 's'],
  divs: [1, 1e3, 1e6, 1e9],
};
const UNIT_BYTE: UnitData = {
  units: ['b', 'kb', 'mb', 'gb'],
  divs: [1, 1e3, 1e6, 1e9],
};

export const toByte = (byte: number) => unitConvertAuto(UNIT_BYTE, byte);
export const toDuration = (ns: number) => unitConvertAuto(UNIT_TIME, ns);

//
// FORMAT
//
export const fmt = {
  duration: (value: number) => pc.yellowBright(toDuration(value)),
  percentage: (value: number) => pc.yellowBright(math.truncate(value * 100) + '%'),
  byte: (value: number) => pc.yellowBright(toByte(value)),
  h2: (name: string) => pc.bold(pc.cyan(name)),
  multiplier: (x: number) => pc.greenBright(math.truncate(x) + 'x'),
  h1: pc.bold,
  success: pc.greenBright,
  error: pc.redBright,
  relativePath: (abs: string) => pc.italic(pc.underline(relative('.', abs))),
};
