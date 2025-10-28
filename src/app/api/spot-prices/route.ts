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

async function fetchSpotPricesFrom(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Elbespararen/1.0', 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const prices = data?.spot_prices || data?.spotPrices || null;
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
  for (const url of CANDIDATE_URLS) {
    try {
      const prices = await fetchSpotPricesFrom(url);
      return NextResponse.json({ success: true, data: prices, source: url });
    } catch {
      // try next
    }
  }
  return NextResponse.json({ success: false, error: 'Could not fetch spot prices' }, { status: 502 });
}


