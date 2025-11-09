export type CloudflareR2Bucket = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
    options?: unknown
  ) => Promise<unknown>;
};

type CloudflarePreparedStatement = {
  bind: (...values: unknown[]) => CloudflarePreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<T>;
  all<T = unknown>(): Promise<{ results: T[] }>;
};

export type CloudflareD1Database = {
  prepare(query: string): CloudflarePreparedStatement;
};


