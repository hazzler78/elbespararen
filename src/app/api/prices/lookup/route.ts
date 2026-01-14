import { NextRequest, NextResponse } from "next/server";
import type { CloudflareD1Database } from "@/types/cloudflare";

export const runtime = 'edge';

type LookupRequest = {
  providerName: string;
  area: string; // se1..se4
  kwh: number;
};

type Normalized = {
  area: string;
  range: { min: number; max: number } | null;
  surcharge?: number;
  variable_costs?: number;
  el_certificate_fee?: number;
  _12_month_discount?: number;
  price?: number;
  monthly_fee?: number;
  total?: number;
  total_with_vat?: number;
  vat?: number;
  source: 'live' | 'cache' | 'unknown';
  updatedAt?: string;
};

// Use slug keys for robust matching
const URL_MAP: Record<string, string> = {
  'cheap-energy': 'https://cheapenergy.se/Site_Priser_CheapEnergy_de2.json',
  'energi2': 'https://energi2.se/Site_Priser_Energi2_de2.json',
  'stockholms-el': 'https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json',
  'svealands-el': 'https://elify.se/Site_Priser_SvealandsEL_de2.json',
  'svekraft': 'https://svekraft.com/Site_Priser_Svekraft_de2.json',
  'motala-el': 'https://elify.se/Site_Priser_Motala_de2.json'
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function canonicalizeProvider(name: string): string | null {
  const slug = slugify(name || '');
  if (URL_MAP[slug]) return slug;
  // Try contains match among slugs
  const key = Object.keys(URL_MAP).find(k => slug.includes(k) || k.includes(slug));
  return key ?? null;
}

function normalizeArea(area: string | null | undefined): string {
  const a = String(area || '').toLowerCase();
  return ['se1','se2','se3','se4'].includes(a) ? a : 'se3';
}

async function getBinding(): Promise<{ db: CloudflareD1Database | null }>{
  let env: any = {};
  if ((globalThis as any).getRequestContext) env = (globalThis as any).getRequestContext()?.env ?? {};
  if (!env.DB && (process.env as any).DB) env.DB = (process.env as any).DB;
  if (!env.DB && (globalThis as any).env?.DB) env.DB = (globalThis as any).env.DB;
  return { db: (env?.DB || null) as CloudflareD1Database | null };
}

async function readCache(db: CloudflareD1Database, providerKey: string, area: string) {
  const row = await db.prepare("SELECT data, updated_at FROM price_cache WHERE provider_key = ? AND area = ?")
    .bind(providerKey, area).first();
  if (!row) return null;
  return { data: JSON.parse(String((row as any).data)), updatedAt: String((row as any).updated_at) } as { data: any; updatedAt: string };
}

async function writeCache(db: CloudflareD1Database, providerKey: string, area: string, payload: any) {
  const now = new Date().toISOString();
  await db.prepare("INSERT OR REPLACE INTO price_cache (provider_key, area, data, updated_at) VALUES (?, ?, ?, ?)")
    .bind(providerKey, area, JSON.stringify(payload), now).run();
  return now;
}

function findAreaArray(obj: any, area: string, providerKey?: string): any[] | null {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) return null;
  // Direct match
  const direct = obj[area];
  if (Array.isArray(direct)) return direct as any[];
  
  // För Cheap Energy, prioritera variable_hourly_rate för rörliga priser
  const isCheapEnergy = providerKey === 'cheap-energy';
  const preferredKeys = isCheapEnergy
    ? [
        'variable_hourly_rate',
        'variable_prices',
        'variable',
        'no_commitment_prices',
        'spot',
        'prices',
        'data',
        'variable_fixed_prices',
        'variable_monthly_rate'
      ]
    : [
        'variable_monthly_rate',
        'variable_prices',
        'variable',
        'no_commitment_prices',
        'variable_hourly_rate',
        'spot',
        'prices',
        'data',
        'variable_fixed_prices'
      ];
  
  for (const key of preferredKeys) {
    if (obj[key]) {
      const found = findAreaArray(obj[key], area, providerKey);
      if (found) return found;
    }
  }
  // Generic deep search
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      const found = findAreaArray(val, area, providerKey);
      if (found) return found;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await getBinding();
    const body = (await request.json()) as LookupRequest;
    const providerKey = canonicalizeProvider(body.providerName || '');
    const area = normalizeArea(body.area);
    const kwh = Math.max(0, Number(body.kwh || 0));

    if (!providerKey) {
      // Return empty data instead of error for unknown providers
      // This prevents console errors when providers aren't in the lookup map
      console.warn(`[prices/lookup] Unknown provider: ${body.providerName}`);
      const normalized: Normalized = {
        area,
        range: null,
        source: 'unknown'
      };
      return NextResponse.json({ 
        success: true, 
        data: normalized
      });
    }

    const url = URL_MAP[providerKey];
    // Try live fetch
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Record<string, unknown>;
      const buckets = findAreaArray(json, area, providerKey);
      if (!Array.isArray(buckets)) throw new Error('Bad JSON structure');
      
      // Förbättrad bucket-val: försök hitta exakt match först
      // Sortera buckets för att prioritera de med störst intervall först (för att hitta rätt bucket)
      const sortedBuckets = [...buckets].sort((a: any, b: any) => {
        const aMin = typeof a?.minConsumption === 'number' ? a.minConsumption : 0;
        const bMin = typeof b?.minConsumption === 'number' ? b.minConsumption : 0;
        return aMin - bMin; // Sortera efter minConsumption (lägsta först)
      });
      
      let bucket = sortedBuckets.find(b => {
        const min = typeof b?.minConsumption === 'number' ? b.minConsumption : null;
        const max = typeof b?.maxConsumption === 'number' ? b.maxConsumption : null;
        if (min === null) return false;
        // Om max saknas, anta att det är oändligt eller använd ett stort värde
        const effectiveMax = max ?? Infinity;
        // Inkludera både min och max i intervallet (inklusive gränser)
        return kwh >= min && kwh <= effectiveMax;
      }) || null;
      
      if (!bucket) {
        // Fallback 1: hitta bucket där kwh >= minConsumption (första bucket som passar)
        const candidates = sortedBuckets.filter(b => {
          const min = typeof b?.minConsumption === 'number' ? b.minConsumption : null;
          if (min === null) return false;
          return kwh >= min;
        });
        
        if (candidates.length > 0) {
          // Välj den bucket som har högst minConsumption men fortfarande <= kwh
          // Detta ger oss den mest specifika bucketen för detta kWh-värde
          bucket = candidates.reduce((best: any, b: any) => {
            if (!best) return b;
            const bestMin = best.minConsumption ?? 0;
            const bMin = b.minConsumption ?? 0;
            // Välj den bucket med högst minConsumption som fortfarande är <= kwh
            if (bMin > bestMin && bMin <= kwh) return b;
            if (bestMin > bMin && bestMin <= kwh) return best;
            // Om båda är lika, välj den med lägst maxConsumption (mer specifik)
            const bestMax = best.maxConsumption ?? Infinity;
            const bMax = b.maxConsumption ?? Infinity;
            return bMax < bestMax ? b : best;
          }, null as any);
        }
        
        // Fallback 2: om fortfarande ingen bucket, välj första
        if (!bucket && sortedBuckets.length > 0) {
          bucket = sortedBuckets[0];
        }
      }
      
      const pack = bucket?.no_commitment ?? bucket?.standard ?? bucket ?? {};
      
      // Debug logging för Cheap Energy
      if (providerKey === 'cheap-energy') {
        const packDetails = bucket?.no_commitment ?? bucket?.standard ?? {};
        console.log(`[prices/lookup] Cheap Energy bucket selection for ${kwh} kWh:`, {
          selectedBucket: bucket ? {
            minConsumption: bucket.minConsumption,
            maxConsumption: bucket.maxConsumption,
            no_commitment: bucket.no_commitment,
            standard: bucket.standard
          } : null,
          totalBuckets: buckets.length,
          allBuckets: sortedBuckets.map((b: any) => {
            const bPack = b?.no_commitment ?? b?.standard ?? {};
            const markup = (bPack.surcharge || 0) + (bPack.variable_costs || 0) + (bPack.el_certificate_fee || 0);
            return {
              min: b.minConsumption,
              max: b.maxConsumption,
              surcharge: bPack.surcharge,
              variable_costs: bPack.variable_costs,
              cert: bPack.el_certificate_fee,
              discount: bPack['12_month_discount'],
              markup: markup,
              total: markup + (bPack['12_month_discount'] || 0)
            };
          }),
          extractedPack: {
            surcharge: pack.surcharge,
            variable_costs: pack.variable_costs,
            el_certificate_fee: pack.el_certificate_fee,
            _12_month_discount: pack['12_month_discount'],
            total_with_vat: pack.total_with_vat,
            markup: (pack.surcharge || 0) + (pack.variable_costs || 0) + (pack.el_certificate_fee || 0),
            calculated_total: (pack.surcharge || 0) + (pack.variable_costs || 0) + (pack.el_certificate_fee || 0) + (pack['12_month_discount'] || 0)
          }
        });
      }
      const normalized: Normalized = {
        area,
        range: bucket ? { min: bucket.minConsumption ?? 0, max: bucket.maxConsumption ?? (bucket.minConsumption ?? 0) } : null,
        surcharge: pack.surcharge,
        variable_costs: pack.variable_costs,
        el_certificate_fee: pack.el_certificate_fee,
        _12_month_discount: pack['12_month_discount'],
        price: pack.price,
        monthly_fee: pack.monthly_fee,
        total: pack.total,
        total_with_vat: pack.total_with_vat,
        vat: pack.vat,
        source: 'live'
      };
      
      // Lägg till debug-info för Cheap Energy i utvecklingsläge
      const response: any = { success: true, data: normalized };
      if (providerKey === 'cheap-energy') {
        response.debug = {
          kwh,
          selectedBucket: bucket ? {
            minConsumption: bucket.minConsumption,
            maxConsumption: bucket.maxConsumption
          } : null,
          totalBuckets: buckets.length,
          allBuckets: sortedBuckets.map((b: any) => {
            const bPack = b?.no_commitment ?? b?.standard ?? {};
            return {
              min: b.minConsumption,
              max: b.maxConsumption,
              surcharge: bPack.surcharge,
              cert: bPack.el_certificate_fee,
              discount: bPack['12_month_discount'],
              total: (bPack.surcharge || 0) + (bPack.el_certificate_fee || 0) + (bPack['12_month_discount'] || 0)
            };
          }),
          extractedValues: {
            surcharge: pack.surcharge,
            cert: pack.el_certificate_fee,
            discount: pack['12_month_discount'],
            calculated_total: (pack.surcharge || 0) + (pack.el_certificate_fee || 0) + (pack['12_month_discount'] || 0)
          }
        };
      }
      
      if (db) await writeCache(db, providerKey, area, normalized);
      return NextResponse.json(response);
    } catch (e) {
      // Fallback to cache
      if (db) {
        const cached = await readCache(db, providerKey, area);
        if (cached) {
          const payload: Normalized = { ...cached.data, source: 'cache', updatedAt: cached.updatedAt };
          return NextResponse.json({ success: true, data: payload });
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('[prices/lookup] error', error);
    return NextResponse.json({ success: false, error: 'Lookup failed' }, { status: 500 });
  }
}


