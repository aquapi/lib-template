import pc from 'picocolors';

const formatMs = (ms: number) => (ms > 1200 ? +(ms / 1e3).toFixed(2) + 's' : +ms.toFixed(2) + 'ms');

export const measureAsyncTask = async <R>(
  name: string,
  fn: (label: string) => R,
): Promise<Awaited<R>> => {
  name = pc.bold('[' + name + ']');
  console.info(name, 'starting');

  let runtime = performance.now();

  try {
    return await fn(name);
  } catch (e) {
    console.error(name, 'error');
    throw e;
  } finally {
    runtime = performance.now() - runtime;
    console.info(name, 'took', formatMs(runtime));
  }
};

export const measureSyncTask = <R>(name: string, fn: (label: string) => R): R => {
  name = pc.bold('[' + name + ']');
  console.info(name, 'starting');

  let runtime = performance.now();

  try {
    return fn(name);
  } catch (e) {
    console.error(name, 'error:', e);
    throw e;
  } finally {
    runtime = performance.now() - runtime;
    console.info(name, 'took', formatMs(runtime));
  }
};
