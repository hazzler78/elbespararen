import type { MetadataRoute } from "next";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? "https://elbespararen.se"
    : "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const routes = [
    "",
    "/upload",
    "/premium",
    "/faq",
    "/foretag",
    "/about",
    "/contact",
    "/news",
    "/contracts",
    "/cookies",
    "/privacy",
    "/terms",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === "" || path === "/upload" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/upload" ? 0.9 : 0.6,
  }));
}
