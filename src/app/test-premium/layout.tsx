// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function TestPremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
