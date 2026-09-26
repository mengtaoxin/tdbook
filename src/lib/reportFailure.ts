/** Print a failure to the console. Durable English diagnostics use `TdLog` separately. */
export function reportFailure(detail: unknown): void {
  console.error(detail);
}
