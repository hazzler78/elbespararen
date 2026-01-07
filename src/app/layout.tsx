import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Hotjar from "@/components/Hotjar";
import TikTokPixel from "@/components/TikTokPixel";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ChatWidget from "@/components/ChatWidget";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Elbespararen – Se din faktura med nya ögon",
  description: "AI-driven analys av din elräkning. Hitta onödiga extra avgifter och se hur mycket du kan spara på spotpris.",
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
