/** Serialize async work so a single SQLite connection is never used concurrently. */
export function createAsyncLock() {
  let chain: Promise<void> = Promise.resolve();

  return function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = chain.then(fn, fn);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
