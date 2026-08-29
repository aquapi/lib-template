import path from 'node:path/posix';

export interface BuildConfig {
  /**
   * Output directory.
   */
  output: string;

  /**
   * Asset patterns to include in package.
   */
  assets: ('LICENSE' | (string & {}))[];

  /**
   * Scripts to include.
   */
  scripts: string[];

  /**
   * File extensions to transform in `src`.
   */
  exts: {
    [K in 'default' | 'types' | 'bun' | 'node' | 'deno' | 'workerd' | 'browser']?: string;
  };

  /**
   * Transform options.
   */
  transform: (
    path: string,
    content: string,
  ) =>
    | {
        code: string;
        declaration?: string;
      }
    | Promise<{
        code: string;
        declaration?: string;
      }>;
}

const defineConfig = (c: BuildConfig) => {
  c.output = './' + path.relative('.', c.output);
  return c;
};
export default defineConfig;
