"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { ContactFormData } from "@/lib/types";

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void | Promise<void>;
}

export default function ContactForm({ onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Namn, e-post och telefon krävs");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setIsSuccess(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-lg p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Tack för ditt intresse!</h3>
        <p className="text-muted">Vi hör av oss inom kort.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm border border-border p-6 space-y-4"
    >
      <div>
        <h3 className="text-xl font-semibold mb-2">Få hjälp att byta</h3>
        <p className="text-sm text-muted">Fyll i dina uppgifter så hjälper vi dig komma igång.</p>
      </div>

      {/* Namn */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Namn <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Ditt namn"
        />
      </div>

      {/* E-post */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          E-post <span className="text-error">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="din@email.se"
        />
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Telefon <span className="text-error">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="070-123 45 67"
        />
      </div>

      {/* Meddelande */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Meddelande (valfritt)
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="Eventuella frågor eller funderingar..."
        />
      </div>

      {/* Error */}
      <div>
        {error && (
          <p
            className="text-sm text-error"
          >
            {error}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Skickar...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Skicka
          </>
        )}
      </button>
    </form>
  );
}

