import type { Bench } from "measure-loop/runner/bench";
import type { Category } from "measure-loop/runner/category";

import reporter from 'measure-loop/reporter';
import { env } from 'measure-loop/runner';

export default <T extends Bench | Category>(b: T): T => {
  import.meta.main && b.run({ env, reporter });
  return b;
}
