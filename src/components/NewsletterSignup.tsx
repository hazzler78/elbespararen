"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { AnalyticsEvents } from "@/lib/analytics";

interface NewsletterSignupProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export default function NewsletterSignup({ variant = "default", className = "" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("E-postadress krävs");
      return;
    }

    // Validera e-post format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ogiltig e-postadress");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name: name || undefined })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Kunde inte anmäla dig till nyhetsbrevet');
      }

      setIsSuccess(true);
      setEmail("");
      setName("");
      
      // Track newsletter subscription
      AnalyticsEvents.newsletterSubscribed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compact variant för footer
  if (variant === "compact") {
    if (isSuccess) {
      return (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
          <p className="text-sm text-success font-medium">Tack! Du är nu anmäld.</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        <div>
          <label htmlFor="newsletter-email-compact" className="block text-sm font-medium mb-2 text-white">
            Prenumerera på nyhetsbrev
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              id="newsletter-email-compact"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="din@email.se"
              required
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </form>
    );
  }

  // Inline variant
  if (variant === "inline") {
    if (isSuccess) {
      return (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-sm text-success font-medium">Tack! Du är nu anmäld.</p>
        </div>
      );
    }

    return (
      <div className={className}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="Din e-postadress"
            required
            className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Prenumerera"
            )}
          </button>
        </form>
        {error && (
          <p className="text-sm text-error mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Default variant
  if (isSuccess) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-lg p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Tack för din prenumeration!</h3>
        <p className="text-muted">Du kommer nu att få våra nyhetsbrev med erbjudanden och energitips.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-lg shadow-sm border border-border p-6 space-y-4 ${className}`}
    >
      <div>
        <h3 className="text-xl font-semibold mb-2">Prenumerera på nyhetsbrev</h3>
        <p className="text-sm text-muted">Få erbjudanden och energitips direkt till din inkorg.</p>
      </div>

      {/* Namn (valfritt) */}
      <div>
        <label htmlFor="newsletter-name" className="block text-sm font-medium mb-1">
          Namn (valfritt)
        </label>
        <input
          type="text"
          id="newsletter-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Ditt namn"
        />
      </div>

      {/* E-post */}
      <div>
        <label htmlFor="newsletter-email" className="block text-sm font-medium mb-1">
          E-post <span className="text-error">*</span>
        </label>
        <input
          type="email"
          id="newsletter-email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          required
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="din@email.se"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Anmäler...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5" />
            Prenumerera
          </>
        )}
      </button>
    </form>
  );
}

