import { BillData } from "@/lib/types";

const PENDING_FLAG = "pendingAnalysis";
const PENDING_KEY = "pendingBillData";
const RESULT_KEY = "billData";

/**
 * Keep a finished analysis across registration and OAuth.
 * Cookie survives the redirects that can drop sessionStorage.
 */
export function persistPendingAnalysis(data: BillData): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(data);
  document.cookie = `${PENDING_KEY}=${encodeURIComponent(json)}; path=/; max-age=3600; SameSite=Lax`;
  localStorage.setItem(PENDING_KEY, json);
  sessionStorage.setItem(RESULT_KEY, json);
  sessionStorage.setItem(PENDING_FLAG, "true");
}

/** Auto-open the result only while the user is still on the upload page. */
export function shouldAutoOpenResult(pathname: string): boolean {
  return pathname === "/upload" || pathname === "/upload/";
}

export function currentPathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}
