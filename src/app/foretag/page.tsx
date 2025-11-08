"use client";

import { motion } from "framer-motion";
import { Briefcase, Sparkles, ShieldCheck, LineChart, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ForetagPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-sm font-semibold">
              <Briefcase className="w-5 h-5" />
              Företag
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              AI-analys av elfakturor för företag och fastighetsägare
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto leading-relaxed">
              Elbespararen hjälper företag, bostadsrättsföreningar och fastighetsägare att hitta onödiga avgifter,
              förhandla bättre avtal och få full kontroll över hela elportföljen – på bara några minuter.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {[
              {
                icon: <Sparkles className="w-6 h-6 text-primary" />,
                title: "Identifiera dolda kostnader",
                description:
                  "Vi går igenom hela fakturan, analyserar effektavgifter, nätkostnader och lokala tillägg. Du får en tydlig rapport med exakta siffror per anläggning.",
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-secondary" />,
                title: "Säker hantering av data",
                description:
                  "All data krypteras, lagras aldrig längre än nödvändigt och behandlas enligt GDPR. Vi kan sätta upp separata flöden och sekretessavtal för större organisationer.",
              },
              {
                icon: <LineChart className="w-6 h-6 text-accent" />,
                title: "Beslutsunderlag för upphandling",
                description:
                  "Få konkreta rekommendationer inför omförhandling. Vi visar best practice på avtalsmodeller och vilka villkor branschen accepterar just nu.",
              },
              {
                icon: <MessageCircle className="w-6 h-6 text-success" />,
                title: "Personlig rådgivning",
                description:
                  "Behöver ni hjälp att tolka rapporten? Våra experter bokar gärna in en genomgång och tar fram åtgärdsplaner för varje kostnadsställe.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-border rounded-xl p-6 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {card.icon}
                </div>
                <h2 className="text-xl font-semibold text-foreground">{card.title}</h2>
                <p className="text-muted leading-relaxed">{card.description}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary">Så fungerar det</h2>
              <p className="text-muted text-lg leading-relaxed">
                Ladda upp fakturor från era anläggningar eller låt oss hämta dem via befintliga kundportaler. Vi
                sammanställer en skräddarsydd analys med besparingspotential, risker och konkreta åtgärdsförslag. Ni
                väljer själva om ni vill gå vidare med oss eller använda insikterna internt.
              </p>
            </div>
            <ul className="grid md:grid-cols-2 gap-4 text-muted">
              <li className="bg-white/60 rounded-lg border border-primary/10 p-4">
                <strong className="block text-foreground mb-1">1. Onboarding</strong>
                Vi sätter upp en säker delningsyta och definierar vilka anläggningar som ska analyseras.
              </li>
              <li className="bg-white/60 rounded-lg border border-primary/10 p-4">
                <strong className="block text-foreground mb-1">2. AI-analys</strong>
                Vår modell tolkar fakturorna visuellt, identifierar extratjänster och räknar fram verkliga kilowattpriser.
              </li>
              <li className="bg-white/60 rounded-lg border border-primary/10 p-4">
                <strong className="block text-foreground mb-1">3. Rapport & målsättning</strong>
                Ni får en prioriterad åtgärdslista med estimerad besparing per leverantör och avtal.
              </li>
              <li className="bg-white/60 rounded-lg border border-primary/10 p-4">
                <strong className="block text-foreground mb-1">4. Uppföljning</strong>
                Vi hjälper er att bevaka upphandlingen eller följer upp med automatiserade kontroller varje månad.
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-border rounded-2xl p-8 md:p-12 text-center space-y-6"
          >
            <h2 className="text-3xl font-bold text-foreground">Redo att ta nästa steg?</h2>
            <p className="text-muted text-lg leading-relaxed">
              Vi bokar gärna ett kort möte för att gå igenom era behov. Använd vårt kontaktformulär eller maila oss så
              återkommer vi inom 24 timmar.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors duration-200"
              >
                Kontakta oss
              </Link>
              <a
                href="mailto:team@elbespararen.se"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors duration-200"
              >
                team@elbespararen.se
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

