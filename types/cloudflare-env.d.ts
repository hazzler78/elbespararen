import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

type CloudflareEnv = {
  BILL_IMAGES?: R2Bucket;
  DB?: D1Database;
  [key: string]: unknown;
};

declare module "cloudflare:env" {
  export const env: CloudflareEnv;
}

