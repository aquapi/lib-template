import defineConfig from '../src/lib/env.ts';
import cmd from '../src/lib/cmd.ts';

export default defineConfig({
  runtime: {
    run: (file) => [cmd`node ${file}`],
  },
  packageManager: {
    init: () => [cmd`pnpm i`],
    publish: (dir) => [cmd`pnpm publish ${dir} --provenance --access=public`],
  },
});
