/**
 * Cloudflare Workers do not support the Node.js stream module.
 * This shim satisfies build-time imports that are never executed at runtime.
 */
export const Readable = {
  from(..._args: unknown[]) {
    throw new Error("node:stream is not available in this runtime.");
  },
};

export default { Readable };


