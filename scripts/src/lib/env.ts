export interface EnvConfig {
  runtime: RuntimeConfig;
  packageManager: PackageManagerConfig;
}
const defineConfig = (c: EnvConfig) => c;
export default defineConfig;

export const escapeValue = JSON.stringify;

// Runtimes
export interface RuntimeConfig {
  run(file: string): string;
  bench(file: string): string;
}

export const node = (overrides?: RuntimeConfig): RuntimeConfig => ({
  run: (file) => `node ${JSON.stringify(file)}`,
  bench: (file) => `node --expose-gc ${escapeValue(file)}`,
  ...overrides
});

export const deno = (overrides?: RuntimeConfig): RuntimeConfig => ({
  run: (file) =>
    `deno -A ${JSON.stringify(file)}`,
  bench: (file) => `deno --v8-flags=--expose-gc -A ${escapeValue(file)}`,
  ...overrides
});

export const bun = (overrides?: RuntimeConfig): RuntimeConfig => ({
  run: (file) => `bun ${escapeValue(file)}`,
  bench: (file) => `bun ${escapeValue(file)}`,
  ...overrides
});

// Package managers
export interface PackageManagerConfig {
  install(pkg: string): string;
  publish(): string;
}

export const npm = (overrides?: PackageManagerConfig): PackageManagerConfig => ({
  install: (pkg) => `npm i ${escapeValue(pkg)}`,
  publish: () => `npm publish --access=public --provenance`,
  ...overrides
});
