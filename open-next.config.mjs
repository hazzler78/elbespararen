export default {
  default: {
    override: {
      // Target Cloudflare Pages runtime
      wrapper: "cloudflare-pages",
      // Use the Pages converter which generates the correct _worker.js and assets
      converter: "pages",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

