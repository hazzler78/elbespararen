"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, Trash2, UserCheck, FileText } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Integritet & Villkor</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary">Integritet</span> & Villkor
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Din integritet är vår högsta prioritet. Här kan du läsa om hur vi hanterar 
              dina uppgifter och vilka villkor som gäller för vår tjänst.
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
            {/* Last Updated */}
            <div className="bg-primary/5 rounded-lg p-4 mb-8 border border-primary/20">
              <p className="text-sm text-muted mb-0">
                <strong>Senast uppdaterad:</strong> 15 januari 2025
              </p>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary" />
                Integritetspolicy
              </h2>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">1. Vilka uppgifter samlar vi in?</h3>
              <p className="text-muted mb-4 leading-relaxed">
                Vi samlar in följande information för att tillhandahålla och förbättra vår tjänst:
              </p>
              <ul className="list-disc pl-6 text-muted mb-6 space-y-2">
                <li>Din elräkning (som du laddar upp) - sparas för AI-träning</li>
                <li>Ditt postnummer (för korrekt prisberäkning)</li>
                <li>Analysresultat och besparingsberäkningar</li>
                <li>Teknisk information (IP-adress, webbläsare) för säkerhet</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 text-foreground">2. Hur använder vi dina uppgifter?</h3>
              <p className="text-muted mb-4 leading-relaxed">
                Dina uppgifter används för att:
              </p>
              <ul className="list-disc pl-6 text-muted mb-6 space-y-2">
                <li>Analysera din elräkning med AI</li>
                <li>Beräkna dina besparingsmöjligheter</li>
                <li>Träna och förbättra vår AI-modell med anonymiserade fakturor</li>
                <li>Utveckla bättre analysalgoritmer för framtida användare</li>
                <li>Ge dig teknisk support vid behov</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 text-foreground">3. Delar vi dina uppgifter?</h3>
              <p className="text-muted mb-6 leading-relaxed">
                <strong>Nej, aldrig.</strong> Vi delar inte, säljer inte eller lånar ut dina personuppgifter till tredje part. 
                Din elräkning och analysresultat är endast synliga för dig.
              </p>

              <h3 className="text-xl font-semibold mb-4 text-foreground">4. Hur länge sparar vi dina uppgifter?</h3>
              <p className="text-muted mb-4 leading-relaxed">
                Vi sparar dina uppgifter enligt följande:
              </p>
              <ul className="list-disc pl-6 text-muted mb-6 space-y-2">
                <li><strong>Fakturabilder:</strong> Sparas för AI-träning tills du begär radering</li>
                <li><strong>Personuppgifter:</strong> Anonymiseras omedelbart och används endast för AI-träning</li>
                <li><strong>Analysresultat:</strong> Sparas i 30 dagar för din åtkomst, sedan raderas</li>
                <li><strong>Teknisk data:</strong> Sparas i 12 månader för säkerhet och prestanda</li>
              </ul>
              <p className="text-muted mb-6 leading-relaxed">
                Du kan när som helst begära radering av dina uppgifter genom att kontakta oss.
              </p>
            </div>

            {/* AI Training Section */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" />
                AI-träning och förbättring
              </h2>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">Hur vi använder dina fakturor för AI-träning</h3>
              <p className="text-muted mb-4 leading-relaxed">
                För att förbättra vår AI och ge dig bättre analyser använder vi dina fakturor på följande sätt:
              </p>
              
              <ul className="list-disc pl-6 text-muted mb-6 space-y-2">
                <li><strong>Anonymisering:</strong> Alla personuppgifter (namn, adress, kundnummer) anonymiseras omedelbart</li>
                <li><strong>Strukturell analys:</strong> AI:n lär sig identifiera olika fakturaformat och avgiftstyper</li>
                <li><strong>Förbättring:</strong> Varje faktura hjälper oss att bli bättre på att hitta dolda avgifter</li>
                <li><strong>Transparens:</strong> Du bidrar till att göra elmarknaden mer transparent för alla</li>
              </ul>

              <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Dina rättigheter</h4>
                <p className="text-sm text-muted mb-3">
                  Du har alltid rätt att begära radering av din faktura från våra träningsdata. 
                  Kontakta oss så hjälper vi dig omedelbart.
                </p>
                <a href="mailto:privacy@elbespararen.se" className="text-sm text-primary hover:underline">
                  Begär radering av min faktura →
                </a>
              </div>
            </div>

            {/* Terms of Service */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Användarvillkor
              </h2>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">1. Tjänstens omfattning</h3>
              <p className="text-muted mb-4 leading-relaxed">
                Elbespararen är en kostnadsfri tjänst som analyserar din elräkning med hjälp av AI-teknologi 
                för att identifiera besparingsmöjligheter. Tjänsten är endast avsedd för svenska elräkningar.
              </p>

              <h3 className="text-xl font-semibold mb-4 text-foreground">2. Användaransvar</h3>
              <p className="text-muted mb-4 leading-relaxed">
                Du ansvarar för att:
              </p>
              <ul className="list-disc pl-6 text-muted mb-6 space-y-2">
                <li>Endast ladda upp dina egna elräkningar</li>
                <li>Ange korrekt postnummer för rätt prisberäkning</li>
                <li>Inte använda tjänsten för olagliga ändamål</li>
                <li>Respektera våra användarvillkor</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 text-foreground">3. Tjänstens tillgänglighet</h3>
              <p className="text-muted mb-6 leading-relaxed">
                Vi strävar efter att hålla tjänsten tillgänglig 24/7, men kan inte garantera oavbruten tillgång. 
                Vi förbehåller oss rätten att tillfälligt stänga ner tjänsten för underhåll eller uppdateringar.
              </p>

              <h3 className="text-xl font-semibold mb-4 text-foreground">4. Ansvarsbegränsning</h3>
              <p className="text-muted mb-6 leading-relaxed">
                Vår analys är endast en rekommendation baserad på tillgänglig information. Du ansvarar för 
                dina egna beslut gällande elavtal och vi kan inte hållas ansvariga för eventuella förluster.
              </p>
            </div>

            {/* Data Protection */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" />
                Dataskydd & GDPR
              </h2>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">Dina rättigheter enligt GDPR</h3>
              <p className="text-muted mb-4 leading-relaxed">
                Som personuppgiftsansvarig följer vi GDPR och du har följande rättigheter:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Rätt till information</h4>
                      <p className="text-sm text-muted">Du har rätt att veta vilka uppgifter vi har om dig</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Rätt till radering</h4>
                      <p className="text-sm text-muted">Du kan begära att dina uppgifter raderas</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Rätt till dataportabilitet</h4>
                      <p className="text-sm text-muted">Du kan få en kopia av dina uppgifter</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Rätt till rättelse</h4>
                      <p className="text-sm text-muted">Du kan begära korrigering av felaktiga uppgifter</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-muted mb-6 leading-relaxed">
                <strong>Kontakta oss:</strong> För att utöva dina rättigheter, skicka ett e-postmeddelande till 
                <a href="mailto:privacy@elbespararen.se" className="text-primary hover:underline"> privacy@elbespararen.se</a>
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-primary/5 rounded-xl p-8 border border-primary/20">
              <h3 className="text-xl font-semibold mb-4 text-primary">Kontakta oss om integritet</h3>
              <p className="text-muted mb-4">
                Har du frågor om vår hantering av personuppgifter eller vill utöva dina rättigheter? 
                Vi svarar inom 24 timmar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:privacy@elbespararen.se"
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-center"
                >
                  Skicka e-post
                </a>
                <Link
                  href="/contact"
                  className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-semibold text-center"
                >
                  Kontakta support
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Känns det säkert?
          </h2>
          <p className="text-lg text-muted mb-8">
            Testa Elbespararen och se hur mycket du kan spara på din elräkning.
          </p>
          <Link
            href="/upload"
            className="
              inline-flex items-center gap-2 px-8 py-4
              bg-primary text-white text-lg font-semibold rounded-lg
              hover:bg-primary/90 active:scale-[0.98]
              transition-all duration-200
            "
          >
            Kom igång nu
            <Shield className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
