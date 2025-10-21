import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";

export const runtime = 'edge';

// Leverantörer med deras endpoints och URL:er
const PRICE_ENDPOINTS = [
  {
    endpoint: "cheapenergy_v2",
    url: "https://cheapenergy.se/Site_Priser_CheapEnergy_de2.json",
    providerName: "Cheap Energy"
  },
  {
    endpoint: "energi2_v2", 
    url: "https://energi2.se/Site_Priser_Energi2_de2.json",
    providerName: "Energi2"
  },
  {
    endpoint: "sthlmsel_v2",
    url: "https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json", 
    providerName: "Stockholms El"
  },
  {
    endpoint: "svealandsel_v2",
    url: "https://elify.se/Site_Priser_SvealandsEL_de2.json",
    providerName: "Svealands EL"
  },
  {
    endpoint: "svekraft_v2",
    url: "https://svekraft.com/Site_Priser_Svekraft_de2.json",
    providerName: "Svekraft"
  },
  {
    endpoint: "motala_v2",
    url: "https://elify.se/Site_Priser_Motala_de2.json",
    providerName: "Motala El"
  }
];

interface PriceData {
  fastpris?: number;
  månadskostnad?: number;
  påslag?: number;
  beskrivning?: string;
  bindningstid?: number;
  gratis_månader?: number;
  features?: string[];
  avtalsalternativ?: Array<{
    namn: string;
    fastpris?: number;
    månadskostnad?: number;
    bindningstid?: number;
    gratis_månader?: number;
  }>;
}

interface ProviderPriceResponse {
  success: boolean;
  data?: PriceData;
  error?: string;
}

// Hämta priser från en extern leverantör
async function fetchProviderPrices(endpoint: string, url: string): Promise<ProviderPriceResponse> {
  try {
    console.log(`[Price Update] Fetching prices from ${endpoint}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Elbespararen/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Price Update] Raw data from ${endpoint}:`, data);

    // Parsa data baserat på endpoint
    let priceData: PriceData = {};
    
    switch (endpoint) {
      case "cheapenergy_v2":
        priceData = parseCheapEnergy(data);
        break;
      case "energi2_v2":
        priceData = parseEnergi2(data);
        break;
      case "sthlmsel_v2":
        priceData = parseStockholmsEl(data);
        break;
      case "svealandsel_v2":
        priceData = parseSvealandsEl(data);
        break;
      case "svekraft_v2":
        priceData = parseSvekraft(data);
        break;
      case "motala_v2":
        priceData = parseMotalaEl(data);
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return {
      success: true,
      data: priceData
    };

  } catch (error) {
    console.error(`[Price Update] Error fetching from ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Parser funktioner för varje leverantör
function parseCheapEnergy(data: any): PriceData {
  // Cheap Energy struktur - hantera flera avtalsalternativ
  const avtalsalternativ = data.avtalsalternativ || data.contracts || [];
  
  // Ta det första eller bästa alternativet
  const bestAlternativ = avtalsalternativ[0] || data;
  
  return {
    fastpris: bestAlternativ.fastpris || bestAlternativ.fastpris_kwh || data.fastpris,
    månadskostnad: bestAlternativ.månadskostnad || bestAlternativ.monthly_fee || data.månadskostnad || 0,
    påslag: bestAlternativ.påslag || bestAlternativ.margin || data.påslag,
    beskrivning: data.beskrivning || "Billigaste alternativet med låga fastpriser",
    bindningstid: bestAlternativ.bindningstid || data.bindningstid || 12,
    gratis_månader: bestAlternativ.gratis_månader || data.gratis_månader || 0,
    features: data.features || ["Låga fastpriser", "Ingen bindningstid"],
    avtalsalternativ: avtalsalternativ
  };
}

function parseEnergi2(data: any): PriceData {
  const avtalsalternativ = data.avtalsalternativ || data.contracts || [];
  const bestAlternativ = avtalsalternativ[0] || data;
  
  return {
    fastpris: bestAlternativ.fastpris || bestAlternativ.fastpris_kwh || data.fastpris,
    månadskostnad: bestAlternativ.månadskostnad || bestAlternativ.monthly_fee || data.månadskostnad || 0,
    påslag: bestAlternativ.påslag || bestAlternativ.margin || data.påslag,
    beskrivning: data.beskrivning || "Stabilt fastpris från Energi2",
    bindningstid: bestAlternativ.bindningstid || data.bindningstid || 24,
    gratis_månader: bestAlternativ.gratis_månader || data.gratis_månader || 0,
    features: data.features || ["Stabilt fastpris", "24 månaders bindningstid"],
    avtalsalternativ: avtalsalternativ
  };
}

function parseStockholmsEl(data: any): PriceData {
  const avtalsalternativ = data.avtalsalternativ || data.contracts || [];
  const bestAlternativ = avtalsalternativ[0] || data;
  
  return {
    fastpris: bestAlternativ.fastpris || bestAlternativ.fastpris_kwh || data.fastpris,
    månadskostnad: bestAlternativ.månadskostnad || bestAlternativ.monthly_fee || data.månadskostnad || 39,
    påslag: bestAlternativ.påslag || bestAlternativ.margin || data.påslag,
    beskrivning: data.beskrivning || "Stockholms El fastpris",
    bindningstid: bestAlternativ.bindningstid || data.bindningstid || 12,
    gratis_månader: bestAlternativ.gratis_månader || data.gratis_månader || 0,
    features: data.features || ["Stockholms El", "Fastpris"],
    avtalsalternativ: avtalsalternativ
  };
}

function parseSvealandsEl(data: any): PriceData {
  const avtalsalternativ = data.avtalsalternativ || data.contracts || [];
  const bestAlternativ = avtalsalternativ[0] || data;
  
  return {
    fastpris: bestAlternativ.fastpris || bestAlternativ.fastpris_kwh || data.fastpris,
    månadskostnad: bestAlternativ.månadskostnad || bestAlternativ.monthly_fee || data.månadskostnad || 29,
    påslag: bestAlternativ.påslag || bestAlternativ.margin || data.påslag,
    beskrivning: data.beskrivning || "Svealands EL fastpris",
    bindningstid: bestAlternativ.bindningstid || data.bindningstid || 24,
    gratis_månader: bestAlternativ.gratis_månader || data.gratis_månader || 0,
    features: data.features || ["Svealands EL", "Fastpris"],
    avtalsalternativ: avtalsalternativ
  };
}

function parseSvekraft(data: any): PriceData {
  const avtalsalternativ = data.avtalsalternativ || data.contracts || [];
  const bestAlternativ = avtalsalternativ[0] || data;
  
  return {
    fastpris: bestAlternativ.fastpris || bestAlternativ.fastpris_kwh || data.fastpris,
    månadskostnad: bestAlternativ.månadskostnad || bestAlternativ.monthly_fee || data.månadskostnad || 0,
    påslag: bestAlternativ.påslag || bestAlternativ.margin || data.påslag,
    beskrivning: data.beskrivning || "Svekraft fastpris - flexibelt utan bindningstid",
    bindningstid: bestAlternativ.bindningstid || data.bindningstid || 0,
    gratis_månader: bestAlternativ.gratis_månader || data.gratis_månader || 0,
    features: data.features || ["Ingen bindningstid", "Fastpris"],
    avtalsalternativ: avtalsalternativ
  };
}

function parseMotalaEl(data: any): PriceData {
  const avtalsalternativ = data.avtalsalternativ || data.contracts || [];
  const bestAlternativ = avtalsalternativ[0] || data;
  
  return {
    fastpris: bestAlternativ.fastpris || bestAlternativ.fastpris_kwh || data.fastpris,
    månadskostnad: bestAlternativ.månadskostnad || bestAlternativ.monthly_fee || data.månadskostnad || 35,
    påslag: bestAlternativ.påslag || bestAlternativ.margin || data.påslag,
    beskrivning: data.beskrivning || "Motala El fastpris",
    bindningstid: bestAlternativ.bindningstid || data.bindningstid || 12,
    gratis_månader: bestAlternativ.gratis_månader || data.gratis_månader || 0,
    features: data.features || ["Motala El", "Fastpris"],
    avtalsalternativ: avtalsalternativ
  };
}

// Huvudfunktion för att uppdatera priser
export async function POST(request: NextRequest) {
  try {
    console.log('[Price Update] Starting price update process...');

    // Hämta D1-binding från Edge-runtime
    let env: any = {};
    
    if ((globalThis as any).getRequestContext) {
      env = (globalThis as any).getRequestContext()?.env ?? {};
    }
    
    if (!env.DB && (process.env as any).DB) {
      env.DB = (process.env as any).DB;
    }
    
    if (!env.DB && (globalThis as any).env?.DB) {
      env.DB = (globalThis as any).env.DB;
    }

    const db = createDatabaseFromBinding(env?.DB);
    
    const updateResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Hämta alla leverantörer från databasen
    const existingProviders = await db.getProviders();
    console.log(`[Price Update] Found ${existingProviders.length} existing providers`);
    
    // Logga vilka leverantörer som INTE påverkas (Rörliga)
    const rörligaProviders = existingProviders.filter(p => p.contractType === "rörligt");
    if (rörligaProviders.length > 0) {
      console.log(`[Price Update] Found ${rörligaProviders.length} Rörliga providers that will NOT be updated:`, 
        rörligaProviders.map(p => p.name));
    }

    // Uppdatera priser för varje endpoint
    for (const endpoint of PRICE_ENDPOINTS) {
      try {
        const priceResponse = await fetchProviderPrices(endpoint.endpoint, endpoint.url);
        
        if (priceResponse.success && priceResponse.data) {
          // Hitta befintlig Fastpris-leverantör för denna endpoint
          let provider = existingProviders.find(p => 
            (p.name.toLowerCase().includes(endpoint.providerName.toLowerCase()) ||
             p.name.toLowerCase().includes(endpoint.endpoint.split('_')[0])) &&
            p.contractType === "fastpris"
          );

          if (!provider) {
            // Skapa ny Fastpris-leverantör om den inte finns
            console.log(`[Price Update] Creating new Fastpris provider: ${endpoint.providerName}`);
            
            const newProvider = await db.createProvider({
              name: endpoint.providerName,
              description: priceResponse.data.beskrivning || `${endpoint.providerName} fastpris`,
              monthlyFee: priceResponse.data.månadskostnad || 0,
              energyPrice: priceResponse.data.fastpris || 1.0,
              freeMonths: priceResponse.data.gratis_månader || 0,
              contractLength: priceResponse.data.bindningstid || 12,
              contractType: "fastpris",
              isActive: true,
              features: priceResponse.data.features || [`${endpoint.providerName} fastpris`],
              websiteUrl: `https://${endpoint.url.split('//')[1].split('/')[0]}`,
              phoneNumber: undefined
            });

            updateResults.push({
              provider: endpoint.providerName,
              action: 'created',
              success: true,
              data: newProvider
            });
            successCount++;

            // Om det finns flera avtalsalternativ, skapa ytterligare leverantörer
            if (priceResponse.data.avtalsalternativ && priceResponse.data.avtalsalternativ.length > 1) {
              console.log(`[Price Update] Creating additional contract alternatives for ${endpoint.providerName}`);
              
              for (let i = 1; i < priceResponse.data.avtalsalternativ.length; i++) {
                const alternativ = priceResponse.data.avtalsalternativ[i];
                const altProvider = await db.createProvider({
                  name: `${endpoint.providerName} ${alternativ.namn}`,
                  description: `${endpoint.providerName} - ${alternativ.namn}`,
                  monthlyFee: alternativ.månadskostnad || 0,
                  energyPrice: alternativ.fastpris || 1.0,
                  freeMonths: alternativ.gratis_månader || 0,
                  contractLength: alternativ.bindningstid || 12,
                  contractType: "fastpris",
                  isActive: true,
                  features: [`${endpoint.providerName}`, alternativ.namn],
                  websiteUrl: `https://${endpoint.url.split('//')[1].split('/')[0]}`,
                  phoneNumber: undefined
                });

                updateResults.push({
                  provider: `${endpoint.providerName} ${alternativ.namn}`,
                  action: 'created_alternative',
                  success: true,
                  data: altProvider
                });
                successCount++;
              }
            }
          } else {
            // Uppdatera befintlig Fastpris-leverantör (bara Fastpris!)
            console.log(`[Price Update] Updating existing Fastpris provider: ${provider.name}`);
            
            const updatedProvider = await db.updateProvider(provider.id, {
              monthlyFee: priceResponse.data.månadskostnad || provider.monthlyFee,
              energyPrice: priceResponse.data.fastpris || provider.energyPrice,
              // BEHÅLL contractType som fastpris - uppdatera INTE till fastpris
              features: priceResponse.data.features || provider.features
            });

            updateResults.push({
              provider: endpoint.providerName,
              action: 'updated',
              success: true,
              data: updatedProvider
            });
            successCount++;
          }
        } else {
          updateResults.push({
            provider: endpoint.providerName,
            action: 'fetch_failed',
            success: false,
            error: priceResponse.error
          });
          errorCount++;
        }
      } catch (error) {
        console.error(`[Price Update] Error processing ${endpoint.providerName}:`, error);
        updateResults.push({
          provider: endpoint.providerName,
          action: 'error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    console.log(`[Price Update] Completed: ${successCount} successful, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Price update completed: ${successCount} successful, ${errorCount} errors`,
      results: updateResults,
      summary: {
        total: PRICE_ENDPOINTS.length,
        successful: successCount,
        errors: errorCount,
        preserved_rörliga: rörligaProviders.map(p => p.name)
      },
      preserved_rörliga: rörligaProviders.map(p => ({
        name: p.name,
        contractType: p.contractType,
        reason: "Rörliga leverantörer uppdateras inte automatiskt"
      }))
    });

  } catch (error) {
    console.error("[Price Update] Fatal error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Kunde inte uppdatera priser",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint för att testa systemet
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Price update endpoint is ready",
    endpoints: PRICE_ENDPOINTS.map(e => ({
      endpoint: e.endpoint,
      providerName: e.providerName
    }))
  });
}
