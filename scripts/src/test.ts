import { testTargets } from '../lib/test/index.ts';

{
  //
  // MAIN
  //
  testTargets(false, process.argv.slice(2));
}
