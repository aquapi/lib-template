export interface Config {
  package: {
    scripts: {
      /**
       * Scripts to include in final `package.json`.
       */
      include: string[];

      /**
       * Command to execute a file.
       */
      runFile: (file: string) => string;
    };

    /**
     * Assets to include.
     */
    assets: string[];
  };
}

export const defineConfig = (t: Config): Config => t;
