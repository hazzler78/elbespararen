"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import type { NewsPost, ApiResponse } from "@/lib/types";

type VideoProvider = "youtube" | "svt";

interface VideoEmbedInfo {
  provider: VideoProvider;
  embedUrl: string;
  originalUrl: string;
}

const parseYouTubeStartTime = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  // Plain seconds (e.g. 90)
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds] = match;
  const totalSeconds =
    (hours ? Number(hours) * 3600 : 0) +
    (minutes ? Number(minutes) * 60 : 0) +
    (seconds ? Number(seconds) : 0);

  return totalSeconds > 0 ? totalSeconds : null;
};

const getVideoEmbedInfo = (rawUrl?: string | null): VideoEmbedInfo | null => {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com"
    ) {
      let videoId = "";

      if (hostname === "youtu.be") {
        videoId = parsed.pathname.slice(1);
      } else {
        const pathParts = parsed.pathname.split("/").filter(Boolean);

        if (parsed.pathname === "/watch" || parsed.pathname === "/") {
          videoId = parsed.searchParams.get("v") ?? "";
        } else if (pathParts[0] === "embed" || pathParts[0] === "shorts") {
          videoId = pathParts[1] ?? "";
        } else if (pathParts.length >= 1) {
          videoId = pathParts[pathParts.length - 1];
        }
      }

      if (!videoId) {
        return null;
      }

      const startTime = parseYouTubeStartTime(parsed.searchParams.get("t") ?? parsed.searchParams.get("start"));
      const playlist = parsed.searchParams.get("list");

      const params = new URLSearchParams({ rel: "0" });
      if (startTime !== null) {
        params.set("start", String(startTime));
      }
      if (playlist) {
        params.set("list", playlist);
      }

      const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}${params.toString() ? `?${params.toString()}` : ""}`;

      return {
        provider: "youtube",
        embedUrl,
        originalUrl: rawUrl,
      };
    }

    if (hostname === "svtplay.se" || hostname.endsWith(".svtplay.se")) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const videoIndex = pathParts.indexOf("video");

      if (videoIndex !== -1 && pathParts.length > videoIndex + 1) {
        const videoId = pathParts[videoIndex + 1];
        const embedParams = new URLSearchParams(parsed.search);

        // Remove modal param to avoid forced modals in embeds
        embedParams.delete("modal");

        const queryString = embedParams.toString();
        const embedUrl = `https://www.svtplay.se/embed/${encodeURIComponent(videoId)}${queryString ? `?${queryString}` : ""}`;

        return {
          provider: "svt",
          embedUrl,
          originalUrl: rawUrl,
        };
      }
    }
  } catch (error) {
    console.warn("Kunde inte skapa videoinbäddning", rawUrl, error);
  }

  return null;
};

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/news");
      const result = await response.json() as ApiResponse<NewsPost[]>;
      
      if (result.success && result.data) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Newspaper className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Nyheter & Media</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary">Nyheter</span> & Media
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Här hittar du de senaste nyheterna om Elbespararen, pressmeddelanden 
              och media-omtalanden. Håll dig uppdaterad om vad som händer i elmarknaden.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none"
          >
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Senaste nyheterna</h2>
              
              <p className="text-muted mb-6 leading-relaxed">
                Följ med oss på vår resa för att göra elmarknaden mer transparent. 
                Här delar vi uppdateringar om nya funktioner, samarbeten och viktiga 
                händelser som påverkar elmarknaden i Sverige.
              </p>

              {/* News items */}
              {isLoading ? (
                <div className="space-y-6 mt-8">
                  <div className="border-l-4 border-primary pl-6 py-4">
                    <p className="text-muted">Laddar nyheter...</p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="space-y-6 mt-8">
                  <div className="border-l-4 border-primary pl-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Inga nyheter ännu</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nyheter kommer snart</h3>
                    <p className="text-muted">
                      Vi arbetar på att fylla denna sida med relevanta nyheter och media-omtalanden. 
                      Kom tillbaka snart för att se våra senaste uppdateringar!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 mt-8">
                  {posts.map((post, index) => {
                    const embedInfo = getVideoEmbedInfo(post.externalLink);
                    const shouldShowImage = Boolean(post.imageUrl && !embedInfo);

                    return (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="border-l-4 border-primary pl-6 py-6 hover:bg-gray-50 rounded-r-lg transition-colors"
                      >
                      <div className="flex items-center gap-2 text-sm text-muted mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.publishedAt).toLocaleDateString("sv-SE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3 text-foreground">
                        {post.externalLink ? (
                          <a 
                            href={post.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors inline-flex items-center gap-2"
                          >
                            {post.title}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          post.title
                        )}
                      </h3>
                      
                      {embedInfo && (
                        <div className="mb-4">
                          <div
                            className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
                            style={{ paddingTop: "56.25%" }}
                          >
                            <iframe
                              src={embedInfo.embedUrl}
                              title={`${post.title} – videospelare`}
                              className="absolute inset-0 h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              referrerPolicy="strict-origin-when-cross-origin"
                            />
                          </div>
                          <p className="mt-2 text-sm text-muted">
                            Videon spelas upp från {embedInfo.provider === "youtube" ? "YouTube" : "SVT Play"}.
                          </p>
                        </div>
                      )}

                      {shouldShowImage && (
                        <div className="mb-4">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full max-w-2xl h-auto rounded-lg object-cover border border-border"
                          />
                        </div>
                      )}
                      
                      {post.excerpt && (
                        <p className="text-lg text-muted mb-4 font-medium">{post.excerpt}</p>
                      )}
                      
                      <div className="prose prose-lg max-w-none">
                        <p className="text-muted whitespace-pre-line leading-relaxed">{post.content}</p>
                      </div>
                      
                      {post.externalLink && (
                        <a 
                          href={post.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          Läs mer
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Media Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-foreground">Media & Press</h2>
            
            <p className="text-muted mb-6 leading-relaxed">
              För pressfrågor och mediaförfrågningar, vänligen kontakta oss via vårt 
              kontaktsformulär eller direkt via e-post.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Kontakta oss
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Redo att börja spara?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Ladda upp din faktura och se dina besparingsmöjligheter på 30 sekunder.
          </p>
          <Link
            href="/upload"
            className="
              inline-flex items-center gap-2 px-8 py-4
              bg-white text-primary text-lg font-semibold rounded-lg
              hover:bg-gray-100 active:scale-[0.98]
              transition-all duration-200
            "
          >
            Kom igång nu
            <Newspaper className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

