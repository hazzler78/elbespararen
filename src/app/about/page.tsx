"use client";

import { motion } from "framer-motion";
import { Zap, Eye, Shield, Users, Target, Heart } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Elbespararen</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Om <span className="text-primary">Elbespararen</span>
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Vi gör elmarknaden transparent genom AI-driven analys av din elfaktura. 
              Hitta dolda avgifter och se exakt hur mycket du kan spara.
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
              <h2 className="text-2xl font-bold mb-6 text-foreground">Vilka är vi – och varför finns Elbespararen?</h2>
              
              <p className="text-muted mb-6 leading-relaxed">
                Elmarknaden i Sverige är ett enda stort kaos. Över 100 elbolag, en djungel av elavtal och prismodeller, 
                och mängder av påslag, fasta avgifter och extratjänster smyger sig in på fakturan. Många har ingen aning 
                om vad de faktiskt betalar för – och det vet elbolagen. Det är just där de tjänar sina pengar.
              </p>

              <p className="text-muted mb-6 leading-relaxed">
                Vi skapade Elbespararen för att vi var trötta på att se människor betala för mycket – utan att ens veta om det. 
                Vi har sett hur svårt det är att hitta ett bra elavtal bland alla erbjudanden, påslag och finstilt.
              </p>

              <p className="text-muted mb-6 leading-relaxed">
                Vi som står bakom Elbespararen har själva jobbat i branschen i över 30 år. Vi har sett hur det fungerar 
                bakom kulisserna – och hur svårt det är för vanliga människor att veta vad som är ett bra avtal, och vad som bara ser bra ut på ytan.
              </p>

              <p className="text-muted mb-8 leading-relaxed">
                Vår AI lär sig kontinuerligt av varje faktura som analyseras. Genom att träna på tusentals svenska elräkningar 
                blir vår analys allt mer exakt och kan hitta avgifter som människor skulle missa. Varje faktura du laddar upp 
                bidrar till att göra elmarknaden mer transparent för alla.
              </p>
            </div>

            {/* Key Points */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Vi är inte ett elbolag</h3>
                </div>
                <p className="text-muted">
                  Du får aldrig en elräkning från oss. Vi jobbar helt oberoende och analyserar bara din befintliga faktura 
                  för att visa dig dina besparingsmöjligheter.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold">AI-driven analys</h3>
                </div>
                <p className="text-muted">
                  Vår AI läser din faktura visuellt och hittar alla dolda avgifter som du skulle missa. 
                  Genom att träna på tusentals fakturor blir den allt mer exakt. Vi visar exakt vad du betalar för – och vad du kan spara.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">Transparent & ärlig</h3>
                </div>
                <p className="text-muted">
                  Vi visar exakt vad vi hittat, med säkerhetspoäng för varje avgift. Inga dolda kostnader, 
                  ingen registrering – bara ärlig information.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold">Helt kostnadsfritt</h3>
                </div>
                <p className="text-muted">
                  Ingen registrering, inga dolda kostnader. Din faktura analyseras och raderas direkt. 
                  Inga personuppgifter sparas.
                </p>
              </motion.div>
            </div>

            {/* Mission Statement */}
            <div className="bg-primary/5 rounded-xl p-8 border border-primary/20">
              <h3 className="text-2xl font-bold mb-4 text-primary">Vårt mål</h3>
              <p className="text-muted text-lg leading-relaxed mb-4">
                Vi vill ge dig kontrollen tillbaka. Du ska slippa lägga timmar på att leta själv. 
                Vi visar bara fram information som är värda att överväga – med tydliga villkor och priser du faktiskt förstår.
              </p>
              <p className="text-muted text-lg leading-relaxed">
                <strong>Du behöver inte förstå hela elmarknaden – det är vårt jobb.</strong><br />
                Du behöver bara fatta ett beslut: att bli Elbespararen i ditt eget hem.
              </p>
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
            <Zap className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
