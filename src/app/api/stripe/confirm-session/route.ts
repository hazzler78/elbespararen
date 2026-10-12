import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { createDatabaseFromBinding } from "@/lib/database";
import { activatePremiumForEmail } from "@/lib/activate-premium";
import { isPremium } from "@/lib/premium";

export const runtime = "edge";

/**
 * Confirm a Stripe Checkout session and activate Premium if paid.
 * Fallback when webhook is delayed or missed.
 * POST /api/stripe/confirm-session { sessionId }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId saknas" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: "Stripe är inte konfigurerat" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionEmail =
      session.metadata?.userEmail ||
      session.customer_details?.email ||
      session.customer_email ||
      null;

    if (
      sessionEmail &&
      sessionEmail.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { success: false, error: "Session tillhör en annan användare" },
        { status: 403 }
      );
    }

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    if (!paid) {
      return NextResponse.json({
        success: true,
        activated: false,
        paymentStatus: session.payment_status,
        status: session.status,
      });
    }

    let env: any = {};
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }

    const db = createDatabaseFromBinding(env?.DB);
    const email = user.email;
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;

    await activatePremiumForEmail(db, email, subId);

    const dbUser = await db.getUserByEmail(email);

    return NextResponse.json({
      success: true,
      activated: true,
      isPremium: isPremium(dbUser),
    });
  } catch (error: any) {
    console.error("[stripe/confirm-session] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Kunde inte bekräfta betalning",
      },
      { status: 500 }
    );
  }
}
