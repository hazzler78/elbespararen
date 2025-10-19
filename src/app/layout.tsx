import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elbespararen – Se din faktura med nya ögon",
  description: "AI-driven analys av din elräkning. Hitta dolda avgifter och se hur mycket du kan spara på spotpris.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
