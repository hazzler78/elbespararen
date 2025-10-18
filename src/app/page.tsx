"use client";

import { motion } from "framer-motion";
import { Zap, Eye, TrendingDown, Shield, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
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
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Elbespararen v7</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Se din elfaktura<br />
              <span className="text-primary">med nya ögon</span>
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              AI-driven analys hittar dolda avgifter och visar exakt hur mycket du kan spara. 
              Enkelt, säkert och helt kostnadsfritt.
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
                Analysera min faktura
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
              100% säkert • Inga personuppgifter sparas
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
                Ta ett foto eller ladda upp PDF:en av din senaste elräkning.
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
                Vår AI läser och förstår fakturan – hittar alla dolda avgifter.
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
                desc: "Din faktura analyseras och raderas direkt. Inga personuppgifter sparas."
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
            Det tar mindre än 2 minuter att få din analys.
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
      <footer className="py-8 px-4 bg-gray-100 text-center text-sm text-muted">
        <p>© 2025 Elbespararen. AI-driven elfaktura-analys.</p>
        <p className="mt-2">Byggd med ❤️ för att göra elmarknaden mer transparent.</p>
      </footer>
    </main>
  );
}
