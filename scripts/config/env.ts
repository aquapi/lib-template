import defineConfig, { node, npm } from '../src/lib/env.ts';

export default defineConfig({
  runtime: node(),
  packageManager: npm()
});
