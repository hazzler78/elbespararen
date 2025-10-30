import { NextRequest, NextResponse } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";

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
  el_certificate_fee?: number;
  _12_month_discount?: number;
  price?: number;
  monthly_fee?: number;
  total?: number;
  total_with_vat?: number;
  vat?: number;
  source: 'live' | 'cache';
  updatedAt?: string;
};

const URL_MAP: Record<string, string> = {
  'cheap energy': 'https://cheapenergy.se/Site_Priser_CheapEnergy_de2.json',
  'energi2': 'https://energi2.se/Site_Priser_Energi2_de2.json',
  'stockholms el': 'https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json',
  'svealands el': 'https://elify.se/Site_Priser_SvealandsEL_de2.json',
  'svekraft': 'https://svekraft.com/Site_Priser_Svekraft_de2.json',
  'motala el': 'https://elify.se/Site_Priser_Motala_de2.json'
};

function canonicalizeProvider(name: string): string | null {
  const n = name.trim().toLowerCase();
  const key = Object.keys(URL_MAP).find(k => n.includes(k));
  return key ?? null;
}

function normalizeArea(area: string | null | undefined): string {
  const a = String(area || '').toLowerCase();
  return ['se1','se2','se3','se4'].includes(a) ? a : 'se3';
}

async function getBinding(): Promise<{ db: D1Database | null }>{
  let env: any = {};
  if ((globalThis as any).getRequestContext) env = (globalThis as any).getRequestContext()?.env ?? {};
  if (!env.DB && (process.env as any).DB) env.DB = (process.env as any).DB;
  if (!env.DB && (globalThis as any).env?.DB) env.DB = (globalThis as any).env.DB;
  return { db: (env?.DB || null) as D1Database | null };
}

async function readCache(db: D1Database, providerKey: string, area: string) {
  const row = await db.prepare("SELECT data, updated_at FROM price_cache WHERE provider_key = ? AND area = ?")
    .bind(providerKey, area).first();
  if (!row) return null;
  return { data: JSON.parse(String((row as any).data)), updatedAt: String((row as any).updated_at) } as { data: any; updatedAt: string };
}

async function writeCache(db: D1Database, providerKey: string, area: string, payload: any) {
  const now = new Date().toISOString();
  await db.prepare("INSERT OR REPLACE INTO price_cache (provider_key, area, data, updated_at) VALUES (?, ?, ?, ?)")
    .bind(providerKey, area, JSON.stringify(payload), now).run();
  return now;
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await getBinding();
    const body = (await request.json()) as LookupRequest;
    const providerKey = canonicalizeProvider(body.providerName || '');
    const area = normalizeArea(body.area);
    const kwh = Math.max(0, Number(body.kwh || 0));

    if (!providerKey) {
      return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 });
    }

    const url = URL_MAP[providerKey];
    // Try live fetch
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Record<string, unknown>;
      const bucketsUnknown = (json as Record<string, unknown>)[area] as unknown;
      if (!Array.isArray(bucketsUnknown as unknown[])) throw new Error('Bad JSON structure');
      const buckets = bucketsUnknown as any[];
      const bucket = buckets.find(b => typeof b?.minConsumption === 'number' && typeof b?.maxConsumption === 'number' && kwh >= b.minConsumption && kwh <= b.maxConsumption) || null;
      const pack = bucket?.no_commitment ?? bucket?.standard ?? bucket ?? {};
      const normalized: Normalized = {
        area,
        range: bucket ? { min: bucket.minConsumption, max: bucket.maxConsumption } : null,
        surcharge: pack.surcharge,
        el_certificate_fee: pack.el_certificate_fee,
        _12_month_discount: pack['12_month_discount'],
        price: pack.price,
        monthly_fee: pack.monthly_fee,
        total: pack.total,
        total_with_vat: pack.total_with_vat,
        vat: pack.vat,
        source: 'live'
      };
      if (db) await writeCache(db, providerKey, area, normalized);
      return NextResponse.json({ success: true, data: normalized });
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


