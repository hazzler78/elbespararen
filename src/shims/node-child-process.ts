/**
 * Cloudflare Workers cannot spawn child processes.
 * This shim only exists to satisfy build-time resolution.
 */
export function spawn(): never {
  throw new Error("node:child_process.spawn is not available in this runtime.");
}

export default { spawn };


