import { symlinkSync } from 'node:fs';
import { join } from 'node:path';

export function* scanMultipleGlobs(patterns: Bun.Glob[], options?: string | Bun.GlobScanOptions) {
  for (let i = 0; i < patterns.length; i++) yield* patterns[i].scanSync(options);
}

export const scanMultiple = (patterns: string[], options?: string | Bun.GlobScanOptions) =>
  scanMultipleGlobs(
    patterns.map((pat) => new Bun.Glob(pat)),
    options,
  );

export function* scan(pattern: string, options?: string | Bun.GlobScanOptions) {
  yield* new Bun.Glob(pattern).scanSync(options);
}

export const cpSync = (fromDir: string, toDir: string, file: string) => {
  try {
    symlinkSync(join(fromDir, file), join(toDir, file));
  } catch {}
};
