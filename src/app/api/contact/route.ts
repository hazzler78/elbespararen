import { NextRequest, NextResponse } from "next/server";
import { addToNewsletter, getDefaultNewsletterGroupId } from "@/lib/email";

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
      try {
        await addToNewsletter({ email, name }, getDefaultNewsletterGroupId());
      } catch (e) {
        console.error("[contact] addToNewsletter failed:", e);
        // Fortsätt ändå
      }
    }

    // Skicka e-post notis (om konfigurerat)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
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

👤 Namn: ${contactData.name}
📧 E-post: ${contactData.email}
📱 Telefon: ${contactData.phone || "Ej angiven"}

💬 Meddelande:
${contactData.message || "Inget meddelande"}

🕒 ${new Date(contactData.timestamp).toLocaleString("sv-SE")}
`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown"
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    console.log("[contact] Telegram notification sent");
  } catch (error) {
    console.error("[contact] Failed to send Telegram notification:", error);
    throw error;
  }
}
