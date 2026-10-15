/** Dynamic + Edge required by @cloudflare/next-on-pages for non-static routes. */
export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
