import { minifySync } from '@swc/core';
import { LIB, toByte } from './utils.ts';

const SORT_SYMBOL = Symbol();

const patterns = process.argv.slice(2);
patterns.length === 0 && patterns.push('**/*.js');

const arr = await Promise.all(
  patterns
    .reduce((prev, pat) => {
      prev.push(...new Bun.Glob(pat).scanSync(LIB));
      return prev;
    }, [] as string[])
    .map(async (path) => {
      const file = Bun.file(LIB + '/' + path);
      const code = await file.text();
      const minifiedCode = minifySync(code, {
        mangle: true,
        compress: {
          passes: 5,
        },
        toplevel: true,
      }).code;

      const minifiedSize = Buffer.from(minifiedCode).byteLength;
      return {
        [SORT_SYMBOL]: minifiedSize,
        Entry: path,
        Size: file.size,
        Minify: minifiedSize,
        GZIP: Bun.gzipSync(code).byteLength,
        'Minify GZIP': Bun.gzipSync(minifiedCode).byteLength,
      };
    }),
);

console.table(
  arr
    .sort((a, b) => a[SORT_SYMBOL] - b[SORT_SYMBOL])
    .reduce(
      (prev, cur) => {
        for (const key in cur)
          // @ts-ignore
          if (Number.isFinite(cur[key])) {
            // @ts-ignore
            prev[0][key] ??= 0;
            // @ts-ignore
            prev[0][key] += cur[key];
          }

        prev.push(cur);
        return prev;
      },
      [
        {
          Entry: 'Total',
        },
      ],
    )
    .reverse()
    .map((cur) => {
      const props = {};

      for (const key in cur)
        // @ts-ignore
        props[key] = Number.isFinite(cur[key]) ? toByte(cur[key]) : cur[key];

      return props;
    }),
);
