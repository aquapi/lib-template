export interface EnvConfig {
  runtime: {
    runScript: (file: string) => string;
  };
  packageManager: {
    /**
     * Setup dependencies.
     */
    init: () => void;

    /**
     * Install dev package.
     */
    devInstall: () => void;

    /**
     * Publish package.
     */
    publish: () => void;
  };
}
const defineConfig = (c: EnvConfig) => c;
export default defineConfig;
