"use client";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Supabase Auth doesn't need a provider - it's handled via middleware
  return <>{children}</>;
}
