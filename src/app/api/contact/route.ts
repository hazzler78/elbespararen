import { NextRequest, NextResponse } from "next/server";
import { addToNewsletter, getDefaultNewsletterGroupId } from "@/lib/email";
import { isTelegramConfigured, sendTelegramMessage, escapeMarkdown } from "@/lib/telegram";

// Edge runtime krävs av next-on-pages
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { 
      name?: string; 
      email?: string; 
      phone?: string; 
      message?: string; 
      subscribeNewsletter?: boolean;
    };
    
    const { name, email, phone, message, subscribeNewsletter } = body;
    
    console.log("[contact] POST request received:", { name, email, phone, hasMessage: !!message });

    // Validera input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Namn och e-post krävs" },
        { status: 400 }
      );
    }

    // Validera e-post format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Ogiltig e-postadress" },
        { status: 400 }
      );
    }

    // Skapa kontaktmeddelande-objekt
    const contactData = {
      name,
      email,
      phone: phone || "",
      message: message || "",
      timestamp: new Date().toISOString(),
      type: "general_contact"
    };

    console.log("[contact] Contact message created:", contactData);

    // Här skulle du normalt spara till databas eller skicka e-post
    // För nu loggar vi bara meddelandet
    console.log("[contact] New contact message:", {
      from: `${name} (${email})`,
      phone: phone || "Ej angiven",
      message: message || "Inget meddelande"
    });

    // Lägg till i nyhetsbrev om valt
    if (subscribeNewsletter && email) {
      console.log("[contact] subscribeNewsletter requested:", { email, name, subscribeNewsletter, group: getDefaultNewsletterGroupId() });
      try {
        await addToNewsletter({ email, name }, getDefaultNewsletterGroupId());
        console.log("[contact] Subscribed to newsletter:", email);
      } catch (e) {
        console.error("[contact] addToNewsletter failed:", e);
        // Fortsätt ändå
      }
    }

    // Skicka Telegram-notis (om konfigurerat)
    if (isTelegramConfigured()) {
      try {
        await sendTelegramNotification(contactData);
      } catch (error) {
        console.error("[contact] Telegram notification failed:", error);
        // Fortsätt även om Telegram misslyckas
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tack för ditt meddelande! Vi hör av oss inom 24 timmar.",
      data: {
        id: Date.now().toString(), // Simulerat ID
        timestamp: contactData.timestamp
      }
    });
  } catch (error) {
    console.error("[contact] POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { success: false, error: `Kunde inte skicka meddelandet: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Skickar Telegram-notis om nytt kontaktmeddelande
 */
async function sendTelegramNotification(contactData: any) {
  const message = `
📧 *Nytt kontaktmeddelande från Elbespararen!*

👤 Namn: ${escapeMarkdown(contactData.name)}
📧 E-post: ${escapeMarkdown(contactData.email)}
📱 Telefon: ${escapeMarkdown(contactData.phone || "Ej angiven")}

💬 Meddelande:
${escapeMarkdown(contactData.message || "Inget meddelande")}

🕒 ${escapeMarkdown(new Date(contactData.timestamp).toLocaleString("sv-SE"))}
`;

  try {
    await sendTelegramMessage(message, "Markdown");
    console.log("[contact] Telegram notification sent");
  } catch (error) {
    console.error("[contact] Failed to send Telegram notification:", error);
    throw error;
  }
}
