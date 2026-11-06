/**
 * User-facing copy for a failed invoice analysis.
 * Never include upstream error text: it can contain credentials or stack traces.
 */
export function messageForAnalysisFailure(input: {
  status?: number;
  error?: string;
  details?: string;
  parseFailed?: boolean;
  network?: boolean;
}): string {
  const blob = `${input.error ?? ""} ${input.details ?? ""}`.toLowerCase();
  const status = input.status ?? 0;

  if (
    input.network ||
    blob.includes("failed to fetch") ||
    blob.includes("load failed") ||
    blob.includes("networkerror")
  ) {
    return "Anslutningen avbröts. Din faktura är kvar — tryck på Kom igång för att försöka igen.";
  }

  if (
    blob.includes("xai_api_key") ||
    blob.includes("api key") ||
    blob.includes("unauthorized") ||
    blob.includes("incorrect api key") ||
    status === 401 ||
    status === 403
  ) {
    return "Analysen kunde inte startas just nu. Din faktura är kvar — försök igen om en stund.";
  }

  if (
    input.parseFailed ||
    status === 502 ||
    status === 504 ||
    status === 524 ||
    blob.includes("timeout") ||
    blob.includes("timed out") ||
    blob.includes("gateway time")
  ) {
    return "Analysen tog för lång tid eller svarade inte. Din faktura är kvar — tryck på Kom igång för att försöka igen.";
  }

  if (input.error && isSafeClientMessage(input.error) && status > 0 && status < 500) {
    return input.error;
  }

  return "Kunde inte analysera fakturan. Din faktura är kvar — tryck på Kom igång för att försöka igen.";
}

function isSafeClientMessage(message: string): boolean {
  if (message.length === 0 || message.length > 180) return false;
  return !/sk-|bearer |exception|stack|api[_ ]key|xai_|at \w+\(/i.test(message);
}
