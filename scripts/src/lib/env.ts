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
}

// Package managers
export interface PackageManagerConfig {
  publish(dir: string): string;
}
