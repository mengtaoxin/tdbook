export type BookConfig = {
  id: string;
  title: string;
  /** Optional; omit or "" when unknown. */
  author?: string;
  type?: string;
  /** Remote `http(s)://…` or site-absolute `/…` (e.g. under `public/`). */
  path: string;
  /** Optional cover image: `http(s)://…` or site path `/…` (e.g. under `public/`). */
  hover?: string;
};

export type BookConfigsFile = {
  books: BookConfig[];
};

export type BookConfigsResult = {
  books: BookConfig[];
  duplicateIds: string[];
};

export type PersistedBookConfigs = {
  url: string;
  books: BookConfig[];
};
