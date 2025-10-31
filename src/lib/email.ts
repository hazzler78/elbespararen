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

function getEmailConfig() {
  const MAILERLITE_API_KEY = getEnvVar("MAILERLITE_API_KEY");
  const MAIL_FROM = getEnvVar("MAIL_FROM") || "info@elchef.se";
  const MAIL_FROM_NAME = getEnvVar("MAIL_FROM_NAME") || "Elchef.se";
  const MAILERLITE_GROUP_NEWSLETTER = getEnvVar("MAILERLITE_GROUP_NEWSLETTER");
  const MAILERLITE_GROUP_RECEIPTS = getEnvVar("MAILERLITE_GROUP_RECEIPTS");
  return { MAILERLITE_API_KEY, MAIL_FROM, MAIL_FROM_NAME, MAILERLITE_GROUP_NEWSLETTER, MAILERLITE_GROUP_RECEIPTS };
}

interface EmailRecipient {
  email: string;
  name?: string;
}

function isEmailConfigured(): boolean {
  const { MAILERLITE_API_KEY } = getEmailConfig();
  return !!MAILERLITE_API_KEY;
}

export async function sendEmail(subject: string, html: string, to: EmailRecipient): Promise<void> {
  const { MAILERLITE_API_KEY, MAIL_FROM, MAIL_FROM_NAME } = getEmailConfig();
  
  // Validera att vi har nödvändig konfiguration
  if (!MAIL_FROM || !to.email) {
    throw new Error(`Missing required email configuration: MAIL_FROM=${!!MAIL_FROM}, to.email=${!!to.email}`);
  }
  
  console.log("[email] Attempting to send email:", { subject, to: to.email, from: MAIL_FROM });
  
  // Primary transport: MailerLite Campaign API (MailChannels kräver verifierad domän)
  // Försök MailerLite först eftersom MailChannels kräver specifik DNS-konfiguration
  if (MAILERLITE_API_KEY) {
    try {
      console.log("[email] Attempting MailerLite Campaign API for:", to.email);
      
      const receiptsGroup = getDefaultReceiptsGroupId();
      
      // Se till att mottagaren finns i MailerLite
      try {
        await addToNewsletter(to, receiptsGroup);
      } catch (addErr) {
        console.log("[email] Subscriber may already exist, continuing...");
      }
      
      // MailerLite Campaign API kräver antingen emails eller groups
      // Vi använder emails för att skicka till specifik mottagare
      const campaignPayload: Record<string, unknown> = {
        name: `Orderbekräftelse - ${Date.now()}`,
        type: "regular",
        subject: subject,
        from_name: MAIL_FROM_NAME,
        from: MAIL_FROM,
        content: html,
        emails: [to.email]  // Skicka direkt till denna mottagare
      };
      
      // Lägg till groups om receiptsGroup finns (för tracking)
      if (receiptsGroup) {
        campaignPayload.groups = [receiptsGroup];
      }
      
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
        console.error("[email] MailerLite campaign creation error:", { status: createResponse.status, body: txt });
        throw new Error(`MailerLite campaign creation failed: ${createResponse.status} ${txt}`);
      }
      
      const campaignData = await createResponse.json() as { data?: { id?: string }; id?: string };
      console.log("[email] MailerLite campaign created:", campaignData);
      const campaignId = campaignData.data?.id || campaignData.id;
      if (campaignId) {
        // Skicka kampanjen direkt till gruppen
        const sendResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${campaignId}/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${MAILERLITE_API_KEY}`
          },
          body: JSON.stringify({
            emails: [to.email]  // Skicka till specifik mottagare
          })
        });
        
        if (!sendResponse.ok) {
          const txt = await sendResponse.text();
          throw new Error(`MailerLite campaign send failed: ${sendResponse.status} ${txt}`);
        }
        
        console.log("[email] ✅ Sent successfully via MailerLite Campaign API:", subject, "to", to.email);
        return;
      }
    } catch (mlErr) {
      const mlErrorMsg = mlErr instanceof Error ? mlErr.message : String(mlErr);
      console.error("[email] MailerLite Campaign API failed:", mlErrorMsg);
      // Kasta felet med mer info så att vi ser vad som gick fel
      throw new Error(`MailerLite failed: ${mlErrorMsg}`);
    }
  } else {
    const errorMsg = "MAILERLITE_API_KEY not set, skipping MailerLite and trying MailChannels";
    console.warn("[email]", errorMsg);
    // Om MAILERLITE_API_KEY saknas, hoppa inte över - försök inte MailChannels heller
    throw new Error(errorMsg);
  }
  
  // Fallback: MailChannels (kräver verifierad domän och DNS-poster)
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

    const mcResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // Auth header required by MailChannels to authenticate sender domain
        "X-AuthUser": MAIL_FROM,
        // X-AuthPass is ignored but some edges require it to be present
        "X-AuthPass": ""
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
        const receiptsGroup = getDefaultReceiptsGroupId();
        
        // Först, se till att mottagaren finns i MailerLite
        try {
          await addToNewsletter(to, receiptsGroup);
        } catch (addErr) {
          // Ignorera om användaren redan finns
          console.log("[email] Subscriber may already exist, continuing...");
        }
        
        // Skapa och skicka campaign direkt till denna mottagare
        // Note: MailerLite Campaigns API kräver att mottagaren finns i en grupp först
        const campaignPayload = {
          name: `Orderbekräftelse - ${Date.now()}`,
          type: "regular",
          subject: subject,
          from_name: MAIL_FROM_NAME,
          from: MAIL_FROM,
          content: html,
          groups: receiptsGroup ? [receiptsGroup] : [],
          filter: {
            segments: [],
            groups: receiptsGroup ? [receiptsGroup] : []
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
              groups: receiptsGroup ? [receiptsGroup] : [],
              filter: {
                segments: [],
                groups: receiptsGroup ? [receiptsGroup] : []
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
}): Promise<void> {
  const { MAIL_FROM_NAME } = getEmailConfig();
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
      <h2 style=\"margin:0 0 12px\">Tack för din beställning!</h2>
      <p>Vi har tagit emot din beställning via <strong>${brandName}</strong> och vidarebefordrar den nu till <strong>${params.providerName}</strong> för aktivering.</p>
      <p>Du kommer att få en separat bekräftelse direkt från elbolaget när avtalet är lagt upp i deras system.</p>
      <p><strong>Referensnummer:</strong> ${params.switchId}</p>
      ${params.estimatedSavings != null ? `<p>Beräknad besparing: <strong>${Math.round(params.estimatedSavings)} kr/mån</strong></p>` : ""}
      ${detailedBlock}
      <p style=\"margin-top:16px\">Vänliga hälsningar,<br/>${MAIL_FROM_NAME}</p>
    </div>
  `;
  await sendEmail(subject, html, { email: params.toEmail, name: params.toName });
}

export async function sendWelcomeEmail(params: {
  toEmail: string;
  toName?: string;
}): Promise<void> {
  const { MAIL_FROM_NAME } = getEmailConfig();
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


