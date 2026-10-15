import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elavtal – jämför och byt | Elbespararen",
  description: "Jämför elavtal och byt till ett billigare alternativ.",
};

/** Avoid SSG collecting page data that pulls browser-only deps (`self is not defined`). */
export const dynamic = "force-dynamic";

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
