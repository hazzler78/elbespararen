import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// Try multiple known provider JSONs that include spot_prices
const CANDIDATE_URLS: string[] = [
  "https://cheapenergy.se/Site_Priser_CheapEnergy_de2.json",
  "https://energi2.se/Site_Priser_Energi2_de2.json",
  "https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json",
  "https://elify.se/Site_Priser_SvealandsEL_de2.json",
  "https://svekraft.com/Site_Priser_Svekraft_de2.json",
  "https://elify.se/Site_Priser_Motala_de2.json"
];

type SpotCache = { data: Record<string, number>, source: string, timestamp: number };
const CACHE_KEY = "__ELBESPARAREN_SPOT_CACHE__";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 timmar

async function fetchSpotPricesFrom(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Elbespararen/1.0', 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: any = await res.json();
  const prices = (data && (data.spot_prices || data.spotPrices)) || null;
  if (!prices || typeof prices !== 'object') throw new Error('No spot_prices in response');
  // Normalize to kr/kWh
  const norm = (v: any) => typeof v === 'number' ? v / 100 : undefined;
  const result = {
    se1: norm(prices.se1 ?? prices.SE1),
    se2: norm(prices.se2 ?? prices.SE2),
    se3: norm(prices.se3 ?? prices.SE3),
    se4: norm(prices.se4 ?? prices.SE4)
  } as Record<string, number | undefined>;
  if (!result.se1 && !result.se2 && !result.se3 && !result.se4) throw new Error('Empty spot_prices');
  return result;
}

export async function GET(_req: NextRequest) {
  // In-memory cache on the edge runtime
  const g = globalThis as any;
  const cached: SpotCache | undefined = g[CACHE_KEY];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, data: cached.data, source: cached.source, cached: true },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
    );
  }

  for (const url of CANDIDATE_URLS) {
    try {
      const prices = await fetchSpotPricesFrom(url);
      const payload = { success: true, data: prices, source: url } as const;
      // store cache
      g[CACHE_KEY] = { data: prices, source: url, timestamp: Date.now() } as SpotCache;
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
    } catch {
      // try next
    }
  }
  return NextResponse.json(
    { success: false, error: 'Could not fetch spot prices' },
    { status: 502, headers: { 'Cache-Control': 'public, max-age=300' } }
  );
}


