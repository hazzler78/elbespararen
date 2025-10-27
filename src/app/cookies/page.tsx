"use client";

import { motion } from "framer-motion";
import { Cookie, Settings, Shield, Eye, Database, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function CookiesPage() {
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
              <Cookie className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Cookies & GDPR</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary">Cookies</span> & GDPR
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Lär dig mer om hur vi använder cookies och följer GDPR-reglerna 
              för att skydda din integritet och förbättra din upplevelse.
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

            {/* Cookie Information */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Cookie className="w-6 h-6 text-primary" />
                Vad är cookies?
              </h2>
              
              <p className="text-muted mb-6 leading-relaxed">
                Cookies är små textfiler som lagras på din enhet när du besöker vår webbplats. 
                De hjälper oss att förbättra din upplevelse, komma ihåg dina inställningar och 
                förstå hur vår webbplats används.
              </p>

              <h3 className="text-xl font-semibold mb-4 text-foreground">Vi använder cookies för att:</h3>
              <ul className="list-disc pl-6 text-muted mb-6 space-y-2">
                <li>Komma ihåg dina inställningar och preferenser</li>
                <li>Förbättra webbplatsens prestanda och funktionalitet</li>
                <li>Analysera hur webbplatsen används (anonymiserat)</li>
                <li>Säkerställa att webbplatsen fungerar korrekt</li>
              </ul>
            </div>

            {/* Cookie Types */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" />
                Typer av cookies vi använder
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Nödvändiga cookies</h3>
                  <p className="text-muted mb-2">
                    Dessa cookies är nödvändiga för att webbplatsen ska fungera korrekt. 
                    De kan inte inaktiveras.
                  </p>
                  <div className="text-sm text-muted">
                    <strong>Exempel:</strong> Sessionscookies, säkerhetscookies, inställningar för språk
                  </div>
                </div>

                <div className="border-l-4 border-secondary pl-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Funktionella cookies</h3>
                  <p className="text-muted mb-2">
                    Dessa cookies förbättrar funktionaliteten och personaliseringen av webbplatsen.
                  </p>
                  <div className="text-sm text-muted">
                    <strong>Exempel:</strong> Inställningar för tema, språkval, användarpreferenser
                  </div>
                </div>

                <div className="border-l-4 border-accent pl-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Analytiska cookies</h3>
                  <p className="text-muted mb-2">
                    Dessa cookies hjälper oss att förstå hur besökare interagerar med webbplatsen.
                  </p>
                  <div className="text-sm text-muted">
                    <strong>Exempel:</strong> Google Analytics (anonymiserat), sidvisningar, klickstatistik
                  </div>
                </div>
              </div>
            </div>

            {/* GDPR Compliance */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                GDPR-efterlevnad
              </h2>
              
              <p className="text-muted mb-6 leading-relaxed">
                Vi följer GDPR (General Data Protection Regulation) och har implementerat 
                följande åtgärder för att skydda din integritet:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Transparens</h4>
                      <p className="text-sm text-muted">Vi är tydliga med vilka cookies vi använder och varför</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Kontroll</h4>
                      <p className="text-sm text-muted">Du kan välja vilka cookies du accepterar</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Minimering</h4>
                      <p className="text-sm text-muted">Vi samlar endast nödvändig information</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Anonymisering</h4>
                      <p className="text-sm text-muted">All analysdata är anonymiserad</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookie Management */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" />
                Hantera dina cookie-inställningar
              </h2>
              
              <p className="text-muted mb-6 leading-relaxed">
                Du har full kontroll över vilka cookies som lagras på din enhet. 
                Du kan ändra dina inställningar när som helst.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4">Dina nuvarande inställningar:</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nödvändiga cookies</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aktiverade</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Funktionella cookies</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aktiverade</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytiska cookies</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Valfria</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                  Ändra cookie-inställningar
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                  Acceptera alla cookies
                </button>
              </div>
            </div>

            {/* Third Party Services */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Tredjepartstjänster</h2>
              
              <p className="text-muted mb-6 leading-relaxed">
                Vi använder följande tredjepartstjänster som kan sätta cookies:
              </p>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Google Analytics</h3>
                  <p className="text-sm text-muted mb-2">
                    Används för att analysera webbplatsens prestanda och användning (anonymiserat).
                  </p>
                  <a href="https://policies.google.com/privacy" className="text-sm text-primary hover:underline">
                    Läs mer om Google's integritetspolicy →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Cloudflare</h3>
                  <p className="text-sm text-muted mb-2">
                    Används för säkerhet och prestandaoptimering.
                  </p>
                  <a href="https://www.cloudflare.com/privacy/" className="text-sm text-primary hover:underline">
                    Läs mer om Cloudflare's integritetspolicy →
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-primary/5 rounded-xl p-8 border border-primary/20">
              <h3 className="text-xl font-semibold mb-4 text-primary">Frågor om cookies?</h3>
              <p className="text-muted mb-4">
                Har du frågor om vår användning av cookies eller vill du ändra dina inställningar? 
                Vi hjälper dig gärna.
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
            Känns det tryggt?
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
            <Cookie className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
