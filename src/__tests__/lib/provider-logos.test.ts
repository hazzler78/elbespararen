import {
  buildProviderLogoObjectKey,
  isProviderLogoObjectKey,
  providerLogoPublicUrl,
  validateProviderLogoFile,
  MAX_PROVIDER_LOGO_BYTES,
} from "@/lib/storage/provider-logos";

function makeFile(
  name: string,
  type: string,
  sizeBytes: number
): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe("provider-logos", () => {
  it("rejects unsupported file types", () => {
    const file = makeFile("logo.gif", "image/gif", 1000);
    expect(validateProviderLogoFile(file)).toMatch(/Ogiltigt/);
  });

  it("rejects oversized files", () => {
    const file = makeFile("logo.png", "image/png", MAX_PROVIDER_LOGO_BYTES + 1);
    expect(validateProviderLogoFile(file)).toMatch(/för stor/);
  });

  it("accepts valid png files", () => {
    const file = makeFile("logo.png", "image/png", 1024);
    expect(validateProviderLogoFile(file)).toBeNull();
  });

  it("builds keys under provider-logos prefix", () => {
    const file = makeFile("enkla.png", "image/png", 100);
    const key = buildProviderLogoObjectKey("enkla-bolaget-1", file);
    expect(isProviderLogoObjectKey(key)).toBe(true);
    expect(key).toMatch(/^provider-logos\/enkla-bolaget-1-/);
    expect(providerLogoPublicUrl(key)).toContain("/api/provider-logos/");
  });
});
