// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
// Cloudflare Pages requires Edge runtime for dynamic routes
export const runtime = 'edge';

export default function TestPremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
