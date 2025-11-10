"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Sparkles, ShieldCheck, LineChart, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ElectricityProvider, ApiResponse } from "@/lib/types";
import { formatCurrency, formatPricePerKwh } from "@/lib/calculations";
import { resolveProviderLogo, createProviderLogoErrorHandler } from "@/lib/logo-utils";

export default function ForetagPage() {
  const [providers, setProviders] = useState<ElectricityProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoadingProviders(true);
        setProvidersError(null);

        const response = await fetch("/api/providers?customerType=business");
        const result = (await response.json()) as ApiResponse<ElectricityProvider[]>;

        if (!isMounted) {
          return;
        }

        if (result.success && result.data) {
          setProviders(result.data);
        } else {
          setProviders([]);
          setProvidersError(result.error || "Kunde inte hämta företagsleverantörer just nu.");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error("[foretag] Failed to fetch business providers:", error);
        setProvidersError("Tekniskt fel vid hämtning av företagsleverantörer.");
      } finally {
        if (isMounted) {
          setIsLoadingProviders(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Rekommenderade elleverantörer för företag
                </h2>
                <p className="text-muted text-lg leading-relaxed">
                  Vi samarbetar med leverantörer som specialiserar sig på företags- och fastighetsavtal.
                  De visas inte i våra konsumentjämförelser utan endast här på företagssidan.
                </p>
              </div>
            </div>

            {isLoadingProviders ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <p className="text-muted">Hämtar företagsleverantörer...</p>
              </div>
            ) : providersError ? (
              <div className="bg-error/10 border border-error/30 text-error rounded-xl p-6 text-center">
                <p className="font-semibold mb-1">Kunde inte ladda leverantörer</p>
                <p className="text-sm">{providersError}</p>
              </div>
            ) : providers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {providers.map((provider, index) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={resolveProviderLogo(provider.name, provider.logoUrl)}
                        alt={`${provider.name} logotyp`}
                        onError={createProviderLogoErrorHandler(provider.name)}
                        className="h-16 w-16 object-contain rounded-md bg-muted/40 p-2"
                        loading="lazy"
                      />
                      <div className="flex-1 space-y-1">
                        <h3 className="text-xl font-semibold text-foreground">{provider.name}</h3>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Företagsavtal
                          </span>
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {provider.contractType === "rörligt" ? "Rörligt" : "Fastpris"}
                          </span>
                          {provider.freeMonths > 0 && (
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
                              {provider.freeMonths} fria mån
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-muted text-sm leading-relaxed">
                      {provider.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted">Månadskostnad</p>
                        <p className="font-semibold text-foreground">
                          {provider.monthlyFee === 0
                            ? "0 kr/mån"
                            : `${formatCurrency(provider.monthlyFee)}/mån`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted">Påslag</p>
                        <p className="font-semibold text-foreground">
                          {formatPricePerKwh(provider.energyPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted">Bindningstid</p>
                        <p className="font-semibold text-foreground">
                          {provider.contractLength > 0 ? `${provider.contractLength} månader` : "Ingen"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted">Support</p>
                        <p className="font-semibold text-foreground">
                          {provider.phoneNumber || "Via kontoansvarig"}
                        </p>
                      </div>
                    </div>

                    {Array.isArray(provider.features) && provider.features.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {provider.features.slice(0, 5).map((feature, featureIndex) => (
                          <span
                            key={`${provider.id}-feature-${featureIndex}`}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                        {provider.features.length > 5 && (
                          <span className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                            +{provider.features.length - 5} till
                          </span>
                        )}
                      </div>
                    )}

                    {provider.websiteUrl && (
                      <a
                        href={provider.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
                      >
                        Besök leverantörens sida
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-border rounded-xl p-8 text-center text-muted">
                <p>
                  Vi uppdaterar just nu våra företagsavtal. Kontakta oss så berättar vi vilka alternativ som
                  passar er verksamhet bäst.
                </p>
              </div>
            )}
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
                Ladda upp fakturor från era anläggningar. Vi sammanställer en tydlig analys med besparingspotential och
                konkreta åtgärdsförslag. Ni väljer själva om ni vill gå vidare med oss eller använda insikterna internt.
              </p>
            </div>
            <ul className="grid md:grid-cols-2 gap-4 text-muted">
              <li className="bg-white/60 rounded-lg border border-primary/10 p-4">
                <strong className="block text-foreground mb-1">1. Onboarding</strong>
                Ni delar fakturorna med oss och vi stämmer av vilka anläggningar som ingår.
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
                href="mailto:info@elchef.se"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors duration-200"
              >
                info@elchef.se
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

