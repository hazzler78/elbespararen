// Force dynamic rendering and Edge runtime for Cloudflare Pages
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
