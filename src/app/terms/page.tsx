"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  // Redirect to privacy page where terms are included
  useEffect(() => {
    // Small delay to show the page briefly before redirect
    const timer = setTimeout(() => {
      router.replace("/privacy#terms");
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="bg-white rounded-xl shadow-lg border border-border p-8">
          <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Användarvillkor</h1>
          <p className="text-muted mb-6">
            Du omdirigeras automatiskt till vår integritetssida där du kan läsa användarvillkoren.
          </p>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Gå till integritet & villkor
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
