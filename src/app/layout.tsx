import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Hotjar from "@/components/Hotjar";
import TikTokPixel from "@/components/TikTokPixel";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ChatWidget from "@/components/ChatWidget";
import Providers from "@/components/Providers";

// Funktion för att konstruera base URL för metadata
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

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Elbespararen – Se din faktura med nya ögon",
  description: "AI-driven analys av din elräkning. Hitta onödiga extra avgifter och se hur mycket du kan spara på spotpris.",
  icons: {
    icon: [
      { url: "/logos/logo_elbespararen.png", type: "image/png", sizes: "any" },
      { url: "/logos/logo.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/logos/logo_elbespararen.png", type: "image/png" },
    ],
    shortcut: "/logos/logo_elbespararen.png",
  },
  openGraph: {
    url: baseUrl,
    title: "Elbespararen – Se din faktura med nya ögon",
    description: "AI-driven analys av din elräkning. Hitta onödiga extra avgifter och se hur mycket du kan spara på spotpris.",
    images: [
      {
        url: "/logos/logo.png", // Relativ sökväg - Next.js gör den absolut via metadataBase
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
    images: ["/logos/logo.png"], // Relativ sökväg - Next.js gör den absolut via metadataBase
  },
};

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
