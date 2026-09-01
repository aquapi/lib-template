export interface BuildConfig {
  /**
   * Scripts to include in final `package.json`.
   */
  scripts: string[];

  /**
   * Assets to include.
   */
  assets: string[];

  /**
   * Transform options.
   */
  transform: (
    relativePath: string,
    content: string,
  ) => {
    code: string;
    declaration?: string;
  };
}

const defineConfig = (c: BuildConfig) => c;
export default defineConfig;
