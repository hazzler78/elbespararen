/** Avoid SSG page-data collection pulling browser webpack chunks (`self is not defined`). */
export const dynamic = "force-dynamic";

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
