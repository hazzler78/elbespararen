import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elavtal – jämför och byt | Elbespararen",
  description: "Jämför elavtal och byt till ett billigare alternativ.",
};

/** Dynamic + Edge required by @cloudflare/next-on-pages for non-static routes. */
export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
