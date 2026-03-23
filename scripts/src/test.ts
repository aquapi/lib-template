import { testBun, testNode } from '../lib/test.ts';

{
  //
  // MAIN
  //
  const targets = process.argv.slice(2);

  if (targets.length === 0) {
    await Promise.all([testNode().exited, testBun().exited]);
  } else {
    await Promise.all([
      targets.includes('node') && testNode().exited,
      targets.includes('bun') && testBun().exited,
    ]);
  }
}
