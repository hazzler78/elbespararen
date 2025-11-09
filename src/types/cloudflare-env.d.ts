declare module "cloudflare:env" {
  export const env: {
    BILL_IMAGES?: {
      put: (
        key: string,
        value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
        options?: unknown
      ) => Promise<unknown>;
    };
    DB?: {
      prepare(query: string): {
        bind: (...values: unknown[]) => {
          first<T = unknown>(): Promise<T | null>;
          run<T = unknown>(): Promise<T>;
          all<T = unknown>(): Promise<{ results: T[] }>;
        };
      };
    };
    [key: string]: unknown;
  };
}



