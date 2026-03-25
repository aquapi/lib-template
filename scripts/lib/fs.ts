import { symlinkSync } from 'node:fs';
import { join, matchesGlob } from 'node:path';

export const matchesGlobs = (path: string, patterns: string[]) => {
  for (let i = 0; i < patterns.length; i++) if (matchesGlob(path, patterns[i])) return true;
  return false;
};

export const cpSync = (fromDir: string, toDir: string, file: string) => {
  try {
    symlinkSync(join(fromDir, file), join(toDir, file));
  } catch {}
};
