"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, Clock } from "lucide-react";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
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
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Kontakt</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary">Kontakta</span> oss
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Har du frågor om Elbespararen eller behöver hjälp med din analys? 
              Vi finns här för att hjälpa dig.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Skicka oss ett meddelande
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Fyll i formuläret så hör vi av oss inom 24 timmar. 
              Vi hjälper dig gärna med alla frågor om Elbespararen.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <ContactForm
              onSubmit={async (data) => {
                try {
                  const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                  });

                  if (!response.ok) {
                    throw new Error('Kunde inte skicka meddelandet');
                  }

                  const result = await response.json();
                  console.log("Kontaktmeddelande skickat:", result);
                } catch (error) {
                  console.error("Fel vid skickande av meddelande:", error);
                  throw error;
                }
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Andra sätt att nå oss</h2>
            <p className="text-muted">
              Vi svarar vanligtvis inom 24 timmar på vardagar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-lg border border-border hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">E-post</h3>
              <p className="text-muted mb-2">support@elbespararen.se</p>
              <p className="text-sm text-muted">Svar inom 24 timmar</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-lg border border-border hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI-chatt</h3>
              <p className="text-muted mb-2">Tillgänglig 24/7</p>
              <p className="text-sm text-muted">Få svar direkt på dina frågor</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-lg border border-border hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Öppettider</h3>
              <p className="text-muted mb-2">Mån-fre: 09:00-17:00</p>
              <p className="text-sm text-muted">Svensk tid</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Vanliga frågor</h2>
            <p className="text-muted">
              Här hittar du svar på de vanligaste frågorna om Elbespararen.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "Är Elbespararen verkligen gratis?",
                answer: "Ja, helt gratis! Ingen registrering, inga dolda kostnader. Vi tjänar inga pengar på dig."
              },
              {
                question: "Sparas min faktura någonstans?",
                answer: "Din faktura sparas för AI-träning men personuppgifter anonymiseras omedelbart. Du kan begära radering när som helst."
              },
              {
                question: "Hur exakt är analysen?",
                answer: "Vår AI har 95%+ träffsäkerhet på att identifiera avgifter. Vi visar alltid säkerhetspoäng för varje hittad avgift."
              },
              {
                question: "Kan jag ladda ner min analys?",
                answer: "Ja, du får en detaljerad rapport som du kan spara eller skriva ut för vidare jämförelse."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg border border-border hover:shadow-sm transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted">{faq.answer}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20 inline-block">
              <h3 className="font-semibold text-lg mb-2 text-primary">Behöver du mer hjälp?</h3>
              <p className="text-muted mb-4">
                Kolla in vår FAQ-sida för fler svar.
              </p>
              <Link
                href="/faq"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Se alla frågor
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
            Ladda upp din faktura och se dina besparingsmöjligheter på 2 minuter.
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
            <MessageCircle className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}