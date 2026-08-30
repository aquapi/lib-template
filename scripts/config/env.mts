import defineConfig from '../src/lib/env.mts';
import cmd from '../src/lib/cmd.mts';

export default defineConfig({
  runtime: {
    run: (file) => [cmd`node ${file}`],
  },
  packageManager: {
    init: () => [cmd`pnpm i`],
    publish: (dir) => [cmd`pnpm publish ${dir} --provenance --access=public`],
  },
});
