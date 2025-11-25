"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, TrendingDown, Shield, ArrowRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import TrustpilotCarousel from "@/components/TrustpilotCarousel";

export default function Home() {
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  return (
    <main className="min-h-screen">
      {/* Compact dropdown banner */}
      <section className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 z-50">
        <div className="max-w-6xl mx-auto relative">
          <button
            onClick={() => setIsBannerOpen(!isBannerOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">
              Teckna elavtal direkt
            </span>
            {isBannerOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          
          <AnimatePresence>
            {isBannerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-full left-0 right-0 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 shadow-lg overflow-hidden"
                style={{ position: 'absolute' }}
              >
                <div className="px-4 pb-4 pt-2">
                  <p className="text-xs text-muted mb-3 text-center">
                    Välj mellan rörligt pris eller fastpris med fastprisgarant
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <a
                      href="https://www.cheapenergy.se/teckna-elavtal-cheap-elchef/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white border border-primary text-primary text-sm font-medium rounded-lg hover:bg-primary hover:text-white transition-all duration-200 text-center"
                    >
                      Rörligt
                    </a>
                    <a
                      href="https://www.svealandselbolag.se/elchef-fastpris/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white border border-primary text-primary text-sm font-medium rounded-lg hover:bg-primary hover:text-white transition-all duration-200 text-center"
                    >
                      Fastpris med fastprisgarant
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo/Title */}
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <img src="/green_elchef.svg" alt="Elchef" className="w-5 h-5" />
              <span className="text-sm font-semibold text-primary">Elchef</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Se din elfaktura<br />
              <span className="text-primary">med nya ögon</span>
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              AI-driven analys hittar onödiga extra avgifter och visar exakt hur mycket du kan spara. 
              Elbespararen - en tjänst från Elchef. Enkelt, säkert och helt kostnadsfritt.
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/upload"
                className="
                  inline-flex items-center gap-2 px-8 py-4 
                  bg-primary text-white text-lg font-semibold rounded-lg
                  hover:bg-primary/90 active:scale-[0.98]
                  transition-all duration-200 shadow-lg hover:shadow-xl
                "
              >
                Kom igång
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Trust badge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-sm text-muted flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              100% säkert • Personuppgifter anonymiseras
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Så fungerar det
            </h2>
            <p className="text-muted text-lg">Tre enkla steg till bättre besparingar</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Ladda upp faktura</h3>
              <p className="text-muted">
                Ta ett foto av din senaste elräkning.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. AI analyserar</h3>
              <p className="text-muted">
                Vår AI läser och förstår fakturan – hittar alla onödiga extra avgifter.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                <TrendingDown className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Se dina besparingar</h3>
              <p className="text-muted">
                Få en tydlig rapport med exakt hur mycket du kan spara per månad.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Varför Elbespararen?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "AI-driven precision",
                desc: "OpenAI Vision läser fakturan visuellt – hittar detaljer du skulle missa."
              },
              {
                title: "Transparent & ärlig",
                desc: "Vi visar exakt vad vi hittat, med säkerhetspoäng för varje avgift."
              },
              {
                title: "Helt kostnadsfritt",
                desc: "Ingen registrering, inga dolda kostnader. Bara ärlig information."
              },
              {
                title: "Säker & privat",
                desc: "Din faktura analyseras säkert och personuppgifter anonymiseras omedelbart. Du kan begära radering när som helst."
              }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-lg border border-border"
              >
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trustpilot Reviews */}
      <TrustpilotCarousel />

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Redo att spara pengar?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Det tar mindre än 30 sekunder att få din analys.
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
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
