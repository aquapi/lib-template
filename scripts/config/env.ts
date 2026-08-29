import defineConfig from '../src/lib/env.ts';
import sh from '../src/lib/sh.ts';

export default defineConfig({
  runtime: {
    run: (file) => sh`node ${file}`,
  },
  packageManager: {
    publish: (dir) => sh`npm publish ${dir} --provenance --access=public`,
  },
});
