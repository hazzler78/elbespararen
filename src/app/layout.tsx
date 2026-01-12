import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Hotjar from "@/components/Hotjar";
import TikTokPixel from "@/components/TikTokPixel";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ChatWidget from "@/components/ChatWidget";
import Providers from "@/components/Providers";

// Funktion för att konstruera absolut URL för Open Graph-bild
function getBaseUrl() {
  // Försök först med environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback för development/production
  return process.env.NODE_ENV === "production" 
    ? "https://elbespararen.se" 
    : "http://localhost:3000";
}

const baseUrl = getBaseUrl();
const ogImageUrl = `${baseUrl}/logos/logo.png`;

export async function generateMetadata(): Promise<Metadata> {
  // Försök läsa från headers i runtime för att få korrekt URL
  let runtimeBaseUrl = baseUrl;
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || 
                     headersList.get("x-forwarded-protocol") ||
                     (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
    if (host) {
      runtimeBaseUrl = `${protocol}://${host}`;
    }
  } catch {
    // Använd fallback om headers inte kan läsas (t.ex. i build-time)
  }

  // Säkerställ att URL:en inte har trailing slash
  runtimeBaseUrl = runtimeBaseUrl.replace(/\/$/, "");
  const runtimeOgImageUrl = `${runtimeBaseUrl}/logos/logo.png`;

  return {
    metadataBase: new URL(runtimeBaseUrl),
    title: "Elbespararen – Se din faktura med nya ögon",
    description: "AI-driven analys av din elräkning. Hitta onödiga extra avgifter och se hur mycket du kan spara på spotpris.",
    openGraph: {
      url: runtimeBaseUrl,
      title: "Elbespararen – Se din faktura med nya ögon",
      description: "AI-driven analys av din elräkning. Hitta onödiga extra avgifter och se hur mycket du kan spara på spotpris.",
      images: [
        {
          url: runtimeOgImageUrl,
          width: 1200,
          height: 630,
          alt: "Elbespararen logotyp",
        },
      ],
      locale: "sv_SE",
      type: "website",
      siteName: "Elbespararen",
    },
    twitter: {
      card: "summary_large_image",
      title: "Elbespararen – Se din faktura med nya ögon",
      description: "AI-driven analys av din elräkning. Hitta onödiga extra avgifter och se hur mycket du kan spara på spotpris.",
      images: [runtimeOgImageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        <Providers>
          <GoogleAnalytics />
          <Hotjar />
          <TikTokPixel />
          <CookieConsentBanner />
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
