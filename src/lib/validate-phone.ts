/**
 * Rimlighetskontroll av telefonnummer (samma logik som /api/leads).
 */
export function validatePhone(raw: string): { ok: boolean; reason?: string } {
  const digits = raw.replace(/[^\d]/g, "").replace(/^46(?=7)/, "0");

  if (digits.length < 7) return { ok: false, reason: "för få siffror" };
  if (digits.length > 13) return { ok: false, reason: "för många siffror" };
  if (/^(\d)\1+$/.test(digits)) return { ok: false, reason: "bara samma siffra om och om" };

  if (digits.startsWith("07")) {
    if (digits.length !== 10) {
      return { ok: false, reason: "svenskt mobilnummer har 10 siffror" };
    }
    const abonnent = digits.slice(2);
    if (/^0+$/.test(abonnent) || /^(\d)\1+$/.test(abonnent)) {
      return { ok: false, reason: "abonnentnumret ser påhittat ut" };
    }
  }

  return { ok: true };
}
