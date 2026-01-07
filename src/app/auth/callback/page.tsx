"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackHandler() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    // Wait for session to be loaded
    if (status === "loading") {
      return;
    }

    // If authenticated, update session and redirect
    if (status === "authenticated" && session) {
      console.log("[Callback] Session authenticated, updating and redirecting...");
      // Manually update session to ensure it's fresh
      update().then(() => {
        console.log("[Callback] Session updated, redirecting to:", callbackUrl);
        router.push(callbackUrl);
      }).catch((error) => {
        console.error("[Callback] Error updating session:", error);
        // Still redirect even if update fails
        router.push(callbackUrl);
      });
      return;
    }

    // If not authenticated after callback, redirect to signin
    if (status === "unauthenticated") {
      console.warn("[Callback] Not authenticated after callback, redirecting to signin");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
  }, [status, session, update, router, callbackUrl]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loggar in...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
