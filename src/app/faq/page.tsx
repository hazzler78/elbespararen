"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Zap, Shield, Eye, Calculator } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "Är Elbespararen verkligen helt gratis?",
    answer: "Ja, Elbespararen är 100% gratis att använda. Ingen registrering krävs, inga dolda kostnader, och vi tjänar inga pengar på dig. Vår tjänst finansieras genom partnerskap med elbolag som vill erbjuda transparenta avtal.",
    category: "Allmänt"
  },
  {
    question: "Sparas min faktura eller personuppgifter någonstans?",
    answer: "Din faktura sparas för att träna vår AI och förbättra analysen, men alla personuppgifter (namn, adress, kundnummer) anonymiseras omedelbart. Du kan när som helst begära radering av din faktura från våra träningsdata. Analysresultat sparas i 30 dagar för din åtkomst.",
    category: "Säkerhet & Integritet"
  },
  {
    question: "Hur exakt är AI-analysen av min faktura?",
    answer: "Vår AI har en träffsäkerhet på över 95% när det gäller att identifiera och kategorisera avgifter på elräkningar. Vi visar alltid ett säkerhetspoäng för varje hittad avgift, så du vet hur säker analysen är.",
    category: "Teknik & AI"
  },
  {
    question: "Vilka typer av fakturor kan jag ladda upp?",
    answer: "Vi accepterar alla svenska elräkningar i formaten JPEG, PNG eller WebP. Fakturan ska vara från de senaste 12 månaderna och innehålla tydlig text. Vi rekommenderar att du fotar fakturan i bra ljus och undviker skuggor.",
    category: "Användning"
  },
  {
    question: "Varför behöver ni mitt postnummer?",
    answer: "Rörliga elpriser varierar kraftigt beroende på var du bor i Sverige. Vi behöver ditt postnummer för att visa dig de korrekta spotpriserna för ditt specifika prisområde och ge dig en mer exakt besparingsberäkning.",
    category: "Användning"
  },
  {
    question: "Kan jag ladda ner eller spara min analys?",
    answer: "Ja, du får en detaljerad rapport som du kan ladda ner som PDF eller skriva ut. Rapporten innehåller alla hittade avgifter, besparingsberäkningar och rekommendationer för framtida elavtal.",
    category: "Användning"
  },
  {
    question: "Vad händer om AI:n inte kan läsa min faktura?",
    answer: "Om vår AI har svårt att läsa din faktura, får du ett tydligt felmeddelande med förslag på hur du kan förbättra bilden. Du kan alltid försöka igen med en bättre bild eller kontakta vår support för hjälp.",
    category: "Teknik & AI"
  },
  {
    question: "Är Elbespararen kopplad till några elbolag?",
    answer: "Nej, vi är helt oberoende och arbetar inte för några specifika elbolag. Vår analys fokuserar enbart på att visa dig vad du betalar för och hur mycket du kan spara genom att byta till spotpris + minimal avgift.",
    category: "Allmänt"
  },
  {
    question: "Hur ofta uppdateras elpriserna i er analys?",
    answer: "Vi uppdaterar spotpriserna dagligen baserat på Nord Pool-marknaden. Våra besparingsberäkningar reflekterar alltid de senaste tillgängliga priserna för ditt prisområde.",
    category: "Teknik & AI"
  },
  {
    question: "Kan jag använda Elbespararen för min företagsfaktura?",
    answer: "För närvarande fokuserar vi på privata elräkningar. Företagsfakturor har ofta andra strukturer och avgifter som kräver en annan typ av analys. Vi arbetar på att utöka vår tjänst till företag i framtiden.",
    category: "Användning"
  },
  {
    question: "Vad är skillnaden mellan fast pris och rörligt pris?",
    answer: "Fast pris innebär att du betalar samma pris per kWh under hela avtalsperioden, oavsett marknadspris. Rörligt pris (spotpris) följer marknadspriserna och kan variera kraftigt mellan timmar, dagar och månader.",
    category: "Elmarknaden"
  },
  {
    question: "Varför är elnätkostnader inte inkluderade i besparingen?",
    answer: "Elnätkostnader (nätavgifter) är samma oavsett vilket elbolag du väljer, eftersom de går till din lokala nätägare. Dessa kostnader kan inte påverkas genom att byta elbolag, så vi fokuserar på de kostnader du faktiskt kan påverka.",
    category: "Elmarknaden"
  },
  {
    question: "Hur använder ni min faktura för AI-träning?",
    answer: "Din faktura används för att träna vår AI att bättre identifiera olika avgiftstyper och fakturaformat. Alla personuppgifter anonymiseras omedelbart - AI:n lär sig endast strukturen och innehållet, inte vem du är. Detta hjälper oss att ge bättre analyser till alla användare.",
    category: "Teknik & AI"
  },
  {
    question: "Kan jag begära att min faktura raderas från AI-träningsdata?",
    answer: "Ja, absolut! Du har alltid rätt att begära radering av din faktura från våra träningsdata. Skicka ett e-post till privacy@elbespararen.se så hjälper vi dig omedelbart. Vi respekterar ditt val och raderar all data som kan kopplas till dig.",
    category: "Säkerhet & Integritet"
  }
];

const categories = ["Alla", "Allmänt", "Säkerhet & Integritet", "Teknik & AI", "Användning", "Elmarknaden"];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState("Alla");

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const filteredFAQs = selectedCategory === "Alla" 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

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
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Vanliga frågor</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary">FAQ</span> - Frågor & Svar
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Här hittar du svar på de vanligaste frågorna om Elbespararen, 
              vår AI-analys och hur du kan spara pengar på din elräkning.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-muted hover:bg-gray-200'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg border border-border overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{faq.question}</h3>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {faq.category}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: openItems.has(index) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {openItems.has(index) ? (
                      <ChevronUp className="w-5 h-5 text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted" />
                    )}
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openItems.has(index) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-muted leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-primary/5 rounded-xl p-8 border border-primary/20 text-center"
          >
            <h3 className="text-2xl font-bold mb-4 text-primary">Hittade du inte svaret?</h3>
            <p className="text-muted mb-6">
              Vi finns här för att hjälpa dig. Kontakta vår support så hjälper vi dig personligen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Kontakta support
              </Link>
              <a
                href="mailto:support@elbespararen.se"
                className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-semibold"
              >
                Skicka e-post
              </a>
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
            Redo att testa Elbespararen?
          </h2>
          <p className="text-lg text-muted mb-8">
            Ladda upp din faktura och se dina besparingsmöjligheter på bara 30 sekunder.
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
            <Zap className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
