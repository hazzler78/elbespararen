// Lightweight email and newsletter integration using MailerLite HTTP API

function getEnvVar(name: string): string | undefined {
  try {
    // next-on-pages provides getRequestContext on Edge
    const ctxEnv = (globalThis as any).getRequestContext?.()?.env;
    if (ctxEnv && typeof ctxEnv[name] === "string" && ctxEnv[name]) return ctxEnv[name] as string;
  } catch {}
  try {
    // Cloudflare Workers style
    const workerEnv = (globalThis as any).env;
    if (workerEnv && typeof workerEnv[name] === "string" && workerEnv[name]) return workerEnv[name] as string;
  } catch {}
  // Fallback to Node-style
  return (process.env as any)?.[name] as string | undefined;
}

interface EmailDomainConfig {
  from: string;
  fromName: string;
  newsletterGroupId?: string;
  receiptsGroupId?: string;
}

function getEmailConfig() {
  const MAILERLITE_API_KEY = getEnvVar("MAILERLITE_API_KEY");
  
  // Sverige (Elchef.se)
  const MAIL_FROM_SE = getEnvVar("MAIL_FROM_SE") || getEnvVar("MAIL_FROM") || "info@elchef.se";
  const MAIL_FROM_NAME_SE = getEnvVar("MAIL_FROM_NAME_SE") || getEnvVar("MAIL_FROM_NAME") || "Elchef.se";
  const MAILERLITE_GROUP_NEWSLETTER_SE = getEnvVar("MAILERLITE_GROUP_NEWSLETTER_SE") || getEnvVar("MAILERLITE_GROUP_NEWSLETTER");
  const MAILERLITE_GROUP_RECEIPTS_SE = getEnvVar("MAILERLITE_GROUP_RECEIPTS_SE") || getEnvVar("MAILERLITE_GROUP_RECEIPTS");
  
  // Norge (Stromsjef.no)
  const MAIL_FROM_NO = getEnvVar("MAIL_FROM_NO") || "post@stromsjef.no";
  const MAIL_FROM_NAME_NO = getEnvVar("MAIL_FROM_NAME_NO") || "Stromsjef.no";
  const MAILERLITE_GROUP_NEWSLETTER_NO = getEnvVar("MAILERLITE_GROUP_NEWSLETTER_NO");
  const MAILERLITE_GROUP_RECEIPTS_NO = getEnvVar("MAILERLITE_GROUP_RECEIPTS_NO");
  
  // Bakåtkompatibilitet (standard)
  const MAIL_FROM = getEnvVar("MAIL_FROM") || "info@elchef.se";
  const MAIL_FROM_NAME = getEnvVar("MAIL_FROM_NAME") || "Elchef.se";
  const MAILERLITE_GROUP_NEWSLETTER = getEnvVar("MAILERLITE_GROUP_NEWSLETTER");
  const MAILERLITE_GROUP_RECEIPTS = getEnvVar("MAILERLITE_GROUP_RECEIPTS");
  
  return { 
    MAILERLITE_API_KEY, 
    MAIL_FROM, 
    MAIL_FROM_NAME, 
    MAILERLITE_GROUP_NEWSLETTER, 
    MAILERLITE_GROUP_RECEIPTS,
    // Sverige
    MAIL_FROM_SE,
    MAIL_FROM_NAME_SE,
    MAILERLITE_GROUP_NEWSLETTER_SE,
    MAILERLITE_GROUP_RECEIPTS_SE,
    // Norge
    MAIL_FROM_NO,
    MAIL_FROM_NAME_NO,
    MAILERLITE_GROUP_NEWSLETTER_NO,
    MAILERLITE_GROUP_RECEIPTS_NO
  };
}

/**
 * Bestämmer vilken avsändaradress som ska användas baserat på Mailerlite grupp-ID
 * 
 * För separata projekt: Varje projekt sätter bara MAIL_FROM och MAILERLITE_GROUP_RECEIPTS
 * för sitt eget land. Denna funktion används för att matcha rätt domän om samma Mailerlite-konto
 * används för flera länder.
 */
function getEmailConfigForGroup(groupId?: string): EmailDomainConfig {
  const config = getEmailConfig();
  
  // Om inget groupId anges, använd standard MAIL_FROM (konfigurerat per projekt)
  if (!groupId) {
    return {
      from: config.MAIL_FROM,
      fromName: config.MAIL_FROM_NAME,
      newsletterGroupId: config.MAILERLITE_GROUP_NEWSLETTER,
      receiptsGroupId: config.MAILERLITE_GROUP_RECEIPTS
    };
  }
  
  // Om groupId matchar en specifik konfiguration, använd den
  // Detta är användbart om samma Mailerlite-konto används för flera länder
  
  // Kontrollera om grupp-ID matchar Norge
  if (config.MAILERLITE_GROUP_NEWSLETTER_NO && groupId === config.MAILERLITE_GROUP_NEWSLETTER_NO) {
    return {
      from: config.MAIL_FROM_NO,
      fromName: config.MAIL_FROM_NAME_NO,
      newsletterGroupId: config.MAILERLITE_GROUP_NEWSLETTER_NO,
      receiptsGroupId: config.MAILERLITE_GROUP_RECEIPTS_NO
    };
  }
  
  if (config.MAILERLITE_GROUP_RECEIPTS_NO && groupId === config.MAILERLITE_GROUP_RECEIPTS_NO) {
    return {
      from: config.MAIL_FROM_NO,
      fromName: config.MAIL_FROM_NAME_NO,
      newsletterGroupId: config.MAILERLITE_GROUP_NEWSLETTER_NO,
      receiptsGroupId: config.MAILERLITE_GROUP_RECEIPTS_NO
    };
  }
  
  // Kontrollera om grupp-ID matchar Sverige
  if (config.MAILERLITE_GROUP_NEWSLETTER_SE && groupId === config.MAILERLITE_GROUP_NEWSLETTER_SE) {
    return {
      from: config.MAIL_FROM_SE,
      fromName: config.MAIL_FROM_NAME_SE,
      newsletterGroupId: config.MAILERLITE_GROUP_NEWSLETTER_SE,
      receiptsGroupId: config.MAILERLITE_GROUP_RECEIPTS_SE
    };
  }
  
  if (config.MAILERLITE_GROUP_RECEIPTS_SE && groupId === config.MAILERLITE_GROUP_RECEIPTS_SE) {
    return {
      from: config.MAIL_FROM_SE,
      fromName: config.MAIL_FROM_NAME_SE,
      newsletterGroupId: config.MAILERLITE_GROUP_NEWSLETTER_SE,
      receiptsGroupId: config.MAILERLITE_GROUP_RECEIPTS_SE
    };
  }
  
  // Fallback till standard (det som är konfigurerat i MAIL_FROM för detta projekt)
  return {
    from: config.MAIL_FROM,
    fromName: config.MAIL_FROM_NAME,
    newsletterGroupId: config.MAILERLITE_GROUP_NEWSLETTER,
    receiptsGroupId: config.MAILERLITE_GROUP_RECEIPTS
  };
}

interface EmailRecipient {
  email: string;
  name?: string;
}

function isEmailConfigured(): boolean {
  const { MAILERLITE_API_KEY } = getEmailConfig();
  return !!MAILERLITE_API_KEY;
}

export async function sendEmail(subject: string, html: string, to: EmailRecipient, groupId?: string): Promise<void> {
  const { MAILERLITE_API_KEY } = getEmailConfig();
  const domainConfig = getEmailConfigForGroup(groupId);
  const MAIL_FROM = domainConfig.from;
  const MAIL_FROM_NAME = domainConfig.fromName;
  const RESEND_API_KEY = getEnvVar("RESEND_API_KEY");
  
  // Validera att vi har nödvändig konfiguration
  if (!MAIL_FROM || !to.email) {
    throw new Error(`Missing required email configuration: MAIL_FROM=${!!MAIL_FROM}, to.email=${!!to.email}`);
  }
  
  console.log("[email] Attempting to send email:", { subject, to: to.email, from: MAIL_FROM });
  
  // Lösning 1: Resend (enklast för transactional emails)
  if (RESEND_API_KEY) {
    try {
      console.log("[email] Attempting Resend API for:", to.email);
      
      const plain = html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: `${MAIL_FROM_NAME} <${MAIL_FROM}>`,
          to: [to.email],
          subject: subject,
          html: html,
          text: plain || subject
        })
      });
      
      if (!resendResponse.ok) {
        const txt = await resendResponse.text();
        console.error("[email] Resend error:", { status: resendResponse.status, body: txt });
        throw new Error(`Resend send failed: ${resendResponse.status} ${txt}`);
      }
      
      const result = await resendResponse.json() as { id?: string };
      console.log("[email] ✅ Sent successfully via Resend:", subject, "to", to.email, "id:", result.id);
      return;
    } catch (resendErr) {
      console.error("[email] Resend failed:", resendErr);
      // Fortsätt till MailChannels fallback
    }
  }
  
  // Lösning 2: MailChannels (kräver MailChannels-konto och verifierad domän - kan aktiveras senare)
  try {
    const plain = html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const emailPayload = {
      mail_from: MAIL_FROM,
      personalizations: [
        {
          to: [{ email: to.email, name: to.name || to.email }]
        }
      ],
      from: { email: MAIL_FROM, name: MAIL_FROM_NAME },
      subject,
      content: [
        { type: "text/plain", value: plain || subject },
        { type: "text/html", value: html }
      ]
    };

    console.log("[email] Sending via MailChannels:", { from: MAIL_FROM, to: to.email, subject });

    // För Cloudflare Pages/Workers: MailChannels verifierar automatiskt via Cloudflare
    // Inga auth headers behövs - Cloudflare Workers/Pages autentiseras automatiskt
    const mcResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
        // Inga auth headers för Cloudflare Pages - verifiering sker automatiskt
      },
      body: JSON.stringify(emailPayload)
    });

    if (!mcResponse.ok) {
      const txt = await mcResponse.text();
      let errorDetails = txt;
      try {
        const parsed = JSON.parse(txt);
        errorDetails = JSON.stringify(parsed, null, 2);
      } catch {}
      const errorMsg = `MailChannels send failed: ${mcResponse.status} - ${errorDetails}`;
      console.error("[email] MailChannels error response:", { 
        status: mcResponse.status, 
        statusText: mcResponse.statusText,
        body: errorDetails,
        headers: Object.fromEntries(mcResponse.headers.entries())
      });
      throw new Error(errorMsg);
    }

    console.log("[email] ✅ Sent successfully via MailChannels:", subject, "to", to.email);
    return;
  } catch (mcErr) {
    console.error("[email] MailChannels error:", mcErr);
    const mcErrorMessage = mcErr instanceof Error ? mcErr.message : String(mcErr);
    
    // Detta borde inte hända eftersom MailerLite redan kördes först
    // Men för säkerhets skull - om MailerLite misslyckade och vi har nått hit:
    try {
      const { MAILERLITE_API_KEY, MAIL_FROM, MAIL_FROM_NAME } = getEmailConfig();
      if (MAILERLITE_API_KEY) {
        console.log("[email] Attempting MailerLite Campaign API fallback for:", to.email);
        
        // Skapa en temporär grupp för denna mottagare, eller använd receipts group
        // Använd rätt grupp baserat på groupId om det finns
        const receiptsGroupToUse = groupId || getDefaultReceiptsGroupId();
        
        // Först, se till att mottagaren finns i MailerLite
        try {
          await addToNewsletter(to, receiptsGroupToUse);
        } catch (addErr) {
          // Ignorera om användaren redan finns
          console.log("[email] Subscriber may already exist, continuing...");
        }
        
        // Skapa och skicka campaign direkt till denna mottagare
        // Note: MailerLite Campaigns API kräver att mottagaren finns i en grupp först
        // receiptsGroupToUse är redan definierad ovan
        const campaignPayload = {
          name: `Orderbekräftelse - ${Date.now()}`,
          type: "regular",
          subject: subject,
          from_name: MAIL_FROM_NAME,
          from: MAIL_FROM,
          content: html,
          groups: receiptsGroupToUse ? [receiptsGroupToUse] : [],
          filter: {
            segments: [],
            groups: receiptsGroupToUse ? [receiptsGroupToUse] : []
          }
        };
        
        // Skapa kampanjen
        const createResponse = await fetch("https://connect.mailerlite.com/api/campaigns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${MAILERLITE_API_KEY}`
          },
          body: JSON.stringify(campaignPayload)
        });
        
        if (!createResponse.ok) {
          const txt = await createResponse.text();
          throw new Error(`MailerLite campaign creation failed: ${createResponse.status} ${txt}`);
        }
        
        const campaign = await createResponse.json() as { data?: { id?: string } };
        if (campaign.data?.id) {
          // Skicka kampanjen direkt
          const sendResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${campaign.data.id}/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${MAILERLITE_API_KEY}`
            },
            body: JSON.stringify({
              groups: receiptsGroupToUse ? [receiptsGroupToUse] : [],
              filter: {
                segments: [],
                groups: receiptsGroupToUse ? [receiptsGroupToUse] : []
              }
            })
          });
          
          if (!sendResponse.ok) {
            const txt = await sendResponse.text();
            throw new Error(`MailerLite campaign send failed: ${sendResponse.status} ${txt}`);
          }
          
          console.log("[email] ✅ Sent successfully via MailerLite Campaign API:", subject, "to", to.email);
          return;
        }
      }
    } catch (mlErr) {
      console.error("[email] MailerLite fallback also failed:", mlErr);
    }
    
    // Både MailerLite och MailChannels misslyckades
    throw new Error(`Email send failed. MailChannels error: ${mcErrorMessage}. Please check configuration.`);
  }

  // Detta borde inte nås - betyder att varken MailerLite eller MailChannels kördes
  throw new Error(`Email send failed. No email service available. Please check MAILERLITE_API_KEY configuration.`);
}

export async function addToNewsletter(recipient: EmailRecipient, groupId?: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] MailerLite not configured; skipping addToNewsletter");
    return;
  }

  try {
    const { MAILERLITE_API_KEY } = getEmailConfig();
    // Use Subscribers endpoint with groups array (avoids 405 on groups/{id}/subscribers in some environments)
    const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: recipient.email,
        fields: recipient.name ? { name: recipient.name } : undefined,
        groups: groupId ? [groupId] : undefined
      })
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`MailerLite subscribe failed: ${response.status} ${raw}`);
    }
    let parsed: unknown = undefined;
    try { parsed = raw ? JSON.parse(raw) : undefined; } catch {}
    console.log("[email] Subscribed to newsletter:", recipient.email, "response:", parsed ?? raw ?? null);
  } catch (error) {
    console.error("[email] addToNewsletter error:", error);
  }
}

export function getDefaultNewsletterGroupId(): string | undefined {
  const { MAILERLITE_GROUP_NEWSLETTER } = getEmailConfig();
  return MAILERLITE_GROUP_NEWSLETTER;
}

export function getDefaultReceiptsGroupId(): string | undefined {
  const { MAILERLITE_GROUP_RECEIPTS } = getEmailConfig();
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
  groupId?: string; // Mailerlite grupp-ID för att bestämma avsändaradress
}): Promise<void> {
  const domainConfig = getEmailConfigForGroup(params.groupId);
  const subject = `Bekräftelse på din beställning – ${params.brand ?? domainConfig.fromName}`;

  const isMovable = (params.contractType ?? "").toLowerCase().startsWith("rör");
  const isFixed = (params.contractType ?? "").toLowerCase().startsWith("fast");
  const brandName = params.brand ?? domainConfig.fromName;

  const detailedBlock = (() => {
    if (isMovable) {
      const hasPriceDetails = params.spotPriceOrePerKwh != null || params.markupOrePerKwh != null || 
                              params.certificateOrePerKwh != null || params.discountOrePerKwh != null;
      
      return `
        <h3 style=\"margin:16px 0 8px\">🔌 Sammanfattning av din beställning</h3>
        <p><strong>Avtalstyp:</strong> Rörligt</p>
        <p style=\"margin:12px 0 4px\">Rörligt månadspris: baseras på föregående månads spotpris + påslag + elcertifikat – rabatt</p>
        ${hasPriceDetails ? `
        <div style=\"padding:16px;background-color:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;margin:12px 0\">
          ${params.spotPriceOrePerKwh != null && params.priceArea ? `<p style=\"margin:8px 0\"><strong>Spotpris (SE${params.priceArea}):</strong> ${params.spotPriceOrePerKwh.toFixed(2)} öre/kWh</p>` : ""}
          ${params.markupOrePerKwh != null ? `<p style=\"margin:8px 0\"><strong>Påslag:</strong> ${params.markupOrePerKwh.toFixed(2)} öre/kWh</p>` : ""}
          ${params.certificateOrePerKwh != null ? `<p style=\"margin:8px 0\"><strong>Elcertifikat:</strong> ${params.certificateOrePerKwh.toFixed(2)} öre/kWh</p>` : ""}
          ${params.discountOrePerKwh != null ? `<p style=\"margin:8px 0\"><strong>Rabatt:</strong> ${params.discountOrePerKwh.toFixed(2)} öre/kWh</p>` : ""}
          ${params.monthlyFeeKr != null ? `<p style=\"margin:8px 0\"><strong>Månadsavgift:</strong> ${params.monthlyFeeKr} kr/mån</p>` : ""}
        </div>
        ` : ""}
      `;
    }
    if (isFixed) {
      return `
        <h3 style=\"margin:16px 0 8px\">🔌 Sammanfattning av din beställning</h3>
        <p><strong>Avtalstyp:</strong> Fast pris</p>
        <div style=\"padding:16px;background-color:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;margin:12px 0\">
          ${params.fixedPriceOrePerKwh != null ? `<p style=\"margin:8px 0\"><strong>Fast pris:</strong> ${params.fixedPriceOrePerKwh.toFixed(2)} öre/kWh</p>` : ""}
          ${params.monthlyFeeKr != null ? `<p style=\"margin:8px 0\"><strong>Månadsavgift:</strong> ${params.monthlyFeeKr} kr/mån</p>` : ""}
          ${params.validityText ? `<p style=\"margin:8px 0\"><strong>Avtalstid:</strong> ${params.validityText}</p>` : ""}
        </div>
      `;
    }
    return "";
  })();

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111;line-height:1.6">
      <h2 style=\"margin:0 0 12px\">Tack för din beställning!</h2>
      <p>Vi har tagit emot din beställning via <strong>${brandName}</strong> och vidarebefordrar den nu till <strong>${params.providerName}</strong> för aktivering.</p>
      <p>Du kommer att få en separat bekräftelse direkt från elbolaget när avtalet är lagt upp i deras system.</p>
      <p><strong>Referensnummer:</strong> ${params.switchId}</p>
      ${params.estimatedSavings != null ? `<p>Beräknad besparing: <strong>${Math.round(params.estimatedSavings)} kr/mån</strong></p>` : ""}
      ${detailedBlock}
      <p style=\"margin-top:16px\">Vänliga hälsningar,<br/>${domainConfig.fromName}</p>
    </div>
  `;
  await sendEmail(subject, html, { email: params.toEmail, name: params.toName }, params.groupId);
}

export async function sendWelcomeEmail(params: {
  toEmail: string;
  toName?: string;
  groupId?: string; // Mailerlite grupp-ID för att bestämma avsändaradress
}): Promise<void> {
  const domainConfig = getEmailConfigForGroup(params.groupId);
  const subject = "Välkommen! Du får nu våra erbjudanden och energitips";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111;line-height:1.6">
      <h2 style=\"margin:0 0 12px\">Välkommen till ${domainConfig.fromName}!</h2>
      <p>Du har valt att ta emot erbjudanden om elavtal och energitjänster via e‑post/SMS.</p>
      <p>Vi skickar bara relevanta tips och kampanjer – du kan när som helst avsluta prenumerationen.</p>
      <p>Vänliga hälsningar,<br/>${domainConfig.fromName}</p>
    </div>
  `;
  await sendEmail(subject, html, { email: params.toEmail, name: params.toName }, params.groupId);
}


