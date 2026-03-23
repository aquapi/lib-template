import { symlinkSync } from 'node:fs';
import { join } from 'node:path';

export function* scanMultiple(patterns: string[], options?: string | Bun.GlobScanOptions) {
  for (let i = 0; i < patterns.length; i++) yield* new Bun.Glob(patterns[i]).scanSync(options);
}

export const cp = (fromDir: string, toDir: string, file: string) => {
  try {
    symlinkSync(join(fromDir, file), join(toDir, file));
  } catch {}
};
