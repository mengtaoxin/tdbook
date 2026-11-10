import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
import { Factory } from 'wa-sqlite';

let modulePromise: Promise<unknown> | null = null;

async function loadWasmBinary(): Promise<ArrayBuffer | undefined> {
  // Only Vitest/Node needs an explicit wasm buffer; browsers fetch via import.meta.url.
  // `import.meta.env.MODE` is statically replaced by Vite so the Node branch is dropped
  // from production client bundles.
  if (import.meta.env.MODE !== 'test') return undefined;

  const { readFileSync } = await import(/* @vite-ignore */ 'node:fs');
  const { createRequire } = await import(/* @vite-ignore */ 'node:module');
  const require = createRequire(import.meta.url);
  const wasmPath = require.resolve('wa-sqlite/dist/wa-sqlite.wasm');
  const bytes = readFileSync(wasmPath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Shared Emscripten module (sync wa-sqlite build). */
export async function getWaSqliteModule(): Promise<unknown> {
  if (!modulePromise) {
    modulePromise = (async () => {
      const wasmBinary = await loadWasmBinary();
      return SQLiteESMFactory(wasmBinary ? { wasmBinary } : undefined);
    })();
  }
  return modulePromise;
}

export async function createSqliteApi(): Promise<ReturnType<typeof Factory>> {
  const module = await getWaSqliteModule();
  return Factory(module);
}
