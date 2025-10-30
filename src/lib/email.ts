// Lightweight email and newsletter integration using MailerLite HTTP API

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || "no-reply@elchef.se";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Elchef.se";
const MAILERLITE_GROUP_NEWSLETTER = process.env.MAILERLITE_GROUP_NEWSLETTER; // string id
const MAILERLITE_GROUP_RECEIPTS = process.env.MAILERLITE_GROUP_RECEIPTS; // string id

interface EmailRecipient {
  email: string;
  name?: string;
}

function isEmailConfigured(): boolean {
  return !!MAILERLITE_API_KEY;
}

export async function sendEmail(subject: string, html: string, to: EmailRecipient): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] MailerLite not configured; skipping sendEmail");
    return;
  }

  try {
    const response = await fetch("https://connect.mailerlite.com/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        from: {
          email: MAIL_FROM,
          name: MAIL_FROM_NAME
        },
        to: [
          {
            email: to.email,
            name: to.name || to.email
          }
        ],
        subject,
        content: [
          {
            type: "text/html",
            value: html
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MailerLite send failed: ${response.status} ${text}`);
    }

    console.log("[email] Sent:", subject, "to", to.email);
  } catch (error) {
    console.error("[email] sendEmail error:", error);
  }
}

export async function addToNewsletter(recipient: EmailRecipient, groupId?: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] MailerLite not configured; skipping addToNewsletter");
    return;
  }

  try {
    const baseUrl = groupId
      ? `https://connect.mailerlite.com/api/groups/${groupId}/subscribers`
      : "https://connect.mailerlite.com/api/subscribers";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: recipient.email,
        fields: recipient.name ? { name: recipient.name } : undefined
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MailerLite subscribe failed: ${response.status} ${text}`);
    }

    console.log("[email] Subscribed to newsletter:", recipient.email);
  } catch (error) {
    console.error("[email] addToNewsletter error:", error);
  }
}

export function getDefaultNewsletterGroupId(): string | undefined {
  return MAILERLITE_GROUP_NEWSLETTER;
}

export function getDefaultReceiptsGroupId(): string | undefined {
  return MAILERLITE_GROUP_RECEIPTS;
}

export async function sendOrderConfirmationEmail(params: {
  toEmail: string;
  toName?: string;
  switchId: string;
  providerName: string;
  estimatedSavings?: number;
  // Optional pricing/meta for detailed template
  contractType?: "rörligt" | "fast" | "fastpris";
  priceArea?: string; // e.g. "3" for SE3
  spotPriceOrePerKwh?: number;
  markupOrePerKwh?: number; // påslag
  certificateOrePerKwh?: number; // elcertifikat
  discountOrePerKwh?: number; // rabatt
  fixedPriceOrePerKwh?: number; // fastpris
  monthlyFeeKr?: number; // månadsavgift
  validityText?: string; // giltighet (t.ex. "12 månader")
  brand?: "Elchef.se" | string;
}): Promise<void> {
  const subject = `Bekräftelse på din beställning – ${params.brand ?? MAIL_FROM_NAME}`;

  const isMovable = (params.contractType ?? "").toLowerCase().startsWith("rör");
  const isFixed = (params.contractType ?? "").toLowerCase().startsWith("fast");
  const brandName = params.brand ?? MAIL_FROM_NAME;

  const detailedBlock = (() => {
    if (isMovable) {
      return `
        <h3 style=\"margin:16px 0 8px\">🔌 Sammanfattning av din beställning</h3>
        <p><strong>Avtalstyp:</strong> Rörligt</p>
        <p style=\"margin:12px 0 4px\">Rörligt månadspris: baseras på föregående månads spotpris + påslag + elcertifikat – rabatt</p>
        <div style=\"padding:12px;border:1px solid #eee;border-radius:8px\">
          ${params.spotPriceOrePerKwh != null && params.priceArea ? `<p>Spotpris (SE${params.priceArea}): <strong>${params.spotPriceOrePerKwh} öre/kWh</strong></p>` : ""}
          ${params.markupOrePerKwh != null ? `<p>Påslag: <strong>${params.markupOrePerKwh} öre/kWh</strong></p>` : ""}
          ${params.certificateOrePerKwh != null ? `<p>Elcertifikat: <strong>${params.certificateOrePerKwh} öre/kWh</strong></p>` : ""}
          ${params.discountOrePerKwh != null ? `<p>Rabatt: <strong>${params.discountOrePerKwh} öre/kWh</strong></p>` : ""}
          ${params.validityText ? `<p>Giltighetstid: <strong>${params.validityText}</strong></p>` : ""}
        </div>
      `;
    }
    if (isFixed) {
      return `
        <h3 style=\"margin:16px 0 8px\">🔌 Sammanfattning av din beställning</h3>
        <p><strong>Avtalstyp:</strong> Fast pris</p>
        <div style=\"padding:12px;border:1px solid #eee;border-radius:8px\">
          ${params.fixedPriceOrePerKwh != null ? `<p>Fast pris: <strong>${params.fixedPriceOrePerKwh} öre/kWh</strong></p>` : ""}
          ${params.monthlyFeeKr != null ? `<p>Månadsavgift: <strong>${params.monthlyFeeKr} kr/mån</strong></p>` : ""}
          ${params.validityText ? `<p>Avtalstid: <strong>${params.validityText}</strong></p>` : ""}
        </div>
      `;
    }
    return "";
  })();

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111;line-height:1.6">
      <h2 style="margin:0 0 12px">Tack för din beställning!</h2>
      <p>Vi har tagit emot din beställning via <strong>${brandName}</strong> och vidarebefordrar den nu till <strong>${params.providerName}</strong> för aktivering.</p>
      <p>Du kommer att få en separat bekräftelse direkt från elbolaget när avtalet är lagt upp i deras system.</p>
      <p><strong>Referensnummer:</strong> ${params.switchId}</p>
      ${params.estimatedSavings != null ? `<p>Beräknad besparing: <strong>${Math.round(params.estimatedSavings)} kr/mån</strong></p>` : ""}
      ${detailedBlock}
      <p style="margin-top:16px">Vänliga hälsningar,<br/>${MAIL_FROM_NAME}</p>
    </div>
  `;
  await sendEmail(subject, html, { email: params.toEmail, name: params.toName });
}

export async function sendWelcomeEmail(params: {
  toEmail: string;
  toName?: string;
}): Promise<void> {
  const subject = "Välkommen! Du får nu våra erbjudanden och energitips";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111;line-height:1.6">
      <h2 style=\"margin:0 0 12px\">Välkommen till ${MAIL_FROM_NAME}!</h2>
      <p>Du har valt att ta emot erbjudanden om elavtal och energitjänster via e‑post/SMS.</p>
      <p>Vi skickar bara relevanta tips och kampanjer – du kan när som helst avsluta prenumerationen.</p>
      <p>Vänliga hälsningar,<br/>${MAIL_FROM_NAME}</p>
    </div>
  `;
  await sendEmail(subject, html, { email: params.toEmail, name: params.toName });
}


