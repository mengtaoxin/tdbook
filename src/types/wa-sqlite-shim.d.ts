declare module 'wa-sqlite/src/examples/AccessHandlePoolVFS.js' {
  export class AccessHandlePoolVFS {
    readonly name: string;
    readonly isReady: Promise<void>;
    constructor(directoryPath: string);
    close(): Promise<void>;
  }
}
