"use client";

import { motion } from "framer-motion";
import { Newspaper, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function NewsPage() {
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

              {/* Placeholder for news items */}
              <div className="space-y-6 mt-8">
                <div className="border-l-4 border-primary pl-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Kommer snart</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nyheter kommer snart</h3>
                  <p className="text-muted">
                    Vi arbetar på att fylla denna sida med relevanta nyheter och media-omtalanden. 
                    Kom tillbaka snart för att se våra senaste uppdateringar!
                  </p>
                </div>
              </div>
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

