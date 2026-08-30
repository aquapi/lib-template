export interface EnvConfig {
  runtime: {
    run: (file: string) => string[];
  };
  packageManager: {
    init: () => string[];
    publish: (dir: string) => string[];
  };
}
const defineConfig = (c: EnvConfig) => c;
export default defineConfig;
