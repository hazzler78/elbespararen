/**
 * Seed ELbasen Supabase electricity_providers from a local providers JSON snapshot.
 * Usage: node scripts/seed-supabase-providers.js scripts/tmp-providers2.json
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_KEY in env (or .env.local).
 */
const fs = require("fs");
const path = require("path");

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}

loadEnvFiles();

async function main() {
  const file = process.argv[2] || "scripts/tmp-providers2.json";
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const providers = raw.data || raw;
  if (!Array.isArray(providers) || providers.length === 0) {
    throw new Error("No providers in snapshot");
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  }

  const rows = providers.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    monthly_fee: Number(p.monthlyFee) || 0,
    energy_price: Number(p.energyPrice) || 0,
    free_months: Number(p.freeMonths) || 0,
    contract_length: Number(p.contractLength) || 0,
    contract_type: p.contractType || "rörligt",
    is_active: p.isActive !== false,
    user_hidden: Boolean(p.userHidden),
    customer_type: p.customerType || "private",
    features: Array.isArray(p.features) ? p.features : [],
    logo_url: p.logoUrl || null,
    website_url: p.websiteUrl || null,
    affiliate_url: p.affiliateUrl || null,
    phone_number: p.phoneNumber || null,
    avtalsalternativ: p.avtalsalternativ || null,
    source: "elbespararen",
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  }));

  // Upsert in chunks
  const chunkSize = 20;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${url}/rest/v1/electricity_providers?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upsert failed ${res.status}: ${text}`);
    }
    console.log(`Upserted ${i + chunk.length}/${rows.length}`);
  }
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
