export interface BuildConfig {
  /**
   * Scripts to include.
   */
  scripts: string[];

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
