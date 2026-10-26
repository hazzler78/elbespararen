"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sun } from "lucide-react";
import type { SolarLeadSource } from "@/lib/types";

type SolarQuoteFormProps = {
  source?: SolarLeadSource;
  defaultConsumption?: string;
  /** When false, omit outer section wrapper (e.g. nested on /result). */
  withSection?: boolean;
};

export default function SolarQuoteForm({
  source = "homepage",
  defaultConsumption = "",
  withSection = true,
}: SolarQuoteFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    consumption: defaultConsumption,
    message: "",
    consentOtovo: false,
  });
  const [utmId, setUtmId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData((prev) =>
      prev.consumption || !defaultConsumption
        ? prev
        : { ...prev, consumption: defaultConsumption }
    );
  }, [defaultConsumption]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("utm_id") || params.get("ref") || "";
    if (fromQuery) setUtmId(fromQuery);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrorMessage(null);
    setSubmitStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (
      !formData.email ||
      !formData.email.includes("@") ||
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.city.trim()
    ) {
      setSubmitStatus("error");
      setErrorMessage("Fyll i alla obligatoriska fält.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.consentOtovo) {
      setSubmitStatus("error");
      setErrorMessage("Godkänn delning med Otovo för att skicka förfrågan.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/solar-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source,
          utmId: utmId || undefined,
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (response.ok && result.success) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          city: "",
          address: "",
          consumption: "",
          message: "",
          consentOtovo: false,
        });
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Något gick fel. Försök igen.");
      }
    } catch {
      setSubmitStatus("error");
      setErrorMessage("Nätverksfel. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInner = (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-900 px-4 py-2 rounded-full mb-4">
          <Sun className="w-5 h-5" />
          <span className="text-sm font-semibold">Solceller</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Ta nästa steg mot total energibesparing
        </h2>
        <p className="text-muted text-lg max-w-xl mx-auto">
          När elavtalet är på plats kan solceller, batteri och laddbox sänka din elräkning
          ytterligare. Lämna en intresseanmälan — ingen förpliktelse.
        </p>
      </div>

      {submitStatus === "success" ? (
        <div className="bg-success/10 border border-success/20 rounded-lg p-8 text-center max-w-lg mx-auto">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Tack för din förfrågan!</h3>
          <p className="text-muted">
            Vår solcellspartner Otovo kontaktar dig för ett kostnadsfritt tillbud.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-border p-6 md:p-8 max-w-lg mx-auto space-y-4"
        >
          <div>
            <label htmlFor="solar-name" className="block text-sm font-medium mb-1">
              Namn <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="solar-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ditt namn"
            />
          </div>

          <div>
            <label htmlFor="solar-email" className="block text-sm font-medium mb-1">
              E-post <span className="text-error">*</span>
            </label>
            <input
              type="email"
              id="solar-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="din@epost.se"
            />
          </div>

          <div>
            <label htmlFor="solar-phone" className="block text-sm font-medium mb-1">
              Telefon <span className="text-error">*</span>
            </label>
            <input
              type="tel"
              id="solar-phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="070-123 45 67"
            />
          </div>

          <div>
            <label htmlFor="solar-city" className="block text-sm font-medium mb-1">
              Stad <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="solar-city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="T.ex. Stockholm"
            />
          </div>

          <div>
            <label htmlFor="solar-address" className="block text-sm font-medium mb-1">
              Adress (valfritt)
            </label>
            <input
              type="text"
              id="solar-address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Gatuadress"
            />
          </div>

          <div>
            <label htmlFor="solar-consumption" className="block text-sm font-medium mb-1">
              Elförbrukning per år (kWh)
            </label>
            <input
              type="text"
              id="solar-consumption"
              name="consumption"
              value={formData.consumption}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="T.ex. 10 000"
            />
          </div>

          <div>
            <label htmlFor="solar-message" className="block text-sm font-medium mb-1">
              Övrigt (valfritt)
            </label>
            <textarea
              id="solar-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              placeholder="T.ex. intresse för laddbox..."
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="solar-consent"
              name="consentOtovo"
              checked={formData.consentOtovo}
              onChange={handleChange}
              required
              className="mt-1"
            />
            <label htmlFor="solar-consent" className="text-sm text-muted">
              Jag godkänner att mina uppgifter delas med{" "}
              <a
                href="https://www.otovo.se"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Otovo
              </a>{" "}
              så att de kan kontakta mig med ett kostnadsfritt solcellsoffert.{" "}
              <span className="text-error">*</span>
            </label>
          </div>

          {(submitStatus === "error" || errorMessage) && (
            <p className="text-sm text-error text-center" role="alert">
              {errorMessage || "Något gick fel. Kontrollera fälten och försök igen."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Skickar...
              </>
            ) : (
              "Begär gratis offert"
            )}
          </button>

          <p className="text-xs text-muted text-center">
            Vi förmedlar kontakten till Otovo. Ingen förpliktelse — du bestämmer själv om du
            vill gå vidare.
          </p>
        </form>
      )}
    </>
  );

  if (!withSection) {
    return <div className="py-4">{formInner}</div>;
  }

  return (
    <section
      id="solceller"
      className="py-20 px-4 bg-gradient-to-b from-amber-50/80 to-background scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto">{formInner}</div>
    </section>
  );
}
