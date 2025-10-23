import { NextRequest, NextResponse } from "next/server";
import { createDatabaseFromBinding } from "@/lib/database";
import type { ContractAlternative } from "@/lib/types";
import { getPriceAreaFromPostalCode, PRICE_AREAS } from "@/lib/price-areas";

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
  avtalsalternativ?: ContractAlternative[];
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

// Generisk parser för alla leverantörer
function parseProviderPrices(data: any, providerName: string): PriceData {
  // Hitta fastpris-data (olika leverantörer har olika strukturer)
  const fixedPrices = data.fixed_prices || data.variable_fixed_prices || {};
  const variableRates = data.variable_monthly_rate || {};
  
  // Skapa avtalsalternativ från fastpris-data
  const avtalsalternativ: ContractAlternative[] = [];
  
  // Lägg till fastpris-alternativ för alla prisområden (se1, se2, se3, se4)
  Object.values(fixedPrices).forEach((regionData: any) => {
    if (regionData && typeof regionData === 'object') {
      Object.entries(regionData).forEach(([period, priceData]: [string, any]) => {
        const months = period === '3_months' ? 3 : 
                      period === '6_months' ? 6 : 
                      period === '1_year' ? 12 : 
                      period === '2_years' ? 24 : 
                      period === '3_years' ? 36 : 
                      period === '4_years' ? 48 : 
                      period === '5_years' ? 60 : 
                      period === '10_years' ? 120 : 12;
        
        avtalsalternativ.push({
          namn: `${months} månader`,
          fastpris: Number((priceData.price / 100).toFixed(2)), // Konvertera från öre till kr och avrunda till 2 decimaler
          månadskostnad: priceData.monthly_fee || 0,
          bindningstid: months,
          gratis_månader: 0
        });
      });
    }
  });
  
  // Ta det bästa alternativet (1 år, annars första)
  const bestAlternativ = avtalsalternativ.find(a => a.bindningstid === 12) || avtalsalternativ[0];
  
  return {
    fastpris: Number((bestAlternativ?.fastpris || 0.5).toFixed(2)), // Fallback till 50 öre/kWh, avrunda till 2 decimaler
    månadskostnad: bestAlternativ?.månadskostnad || 0,
    påslag: 0, // Fastpris har inget påslag
    beskrivning: `${providerName} fastpris - flera avtalsalternativ tillgängliga`,
    bindningstid: bestAlternativ?.bindningstid || 12,
    gratis_månader: bestAlternativ?.gratis_månader || 0,
    features: ["Fastpris", "Flera avtalsalternativ"],
    avtalsalternativ: avtalsalternativ
  };
}

// Parser funktioner för varje leverantör
function parseCheapEnergy(data: any): PriceData {
  return parseProviderPrices(data, "Cheap Energy");
}

function parseEnergi2(data: any): PriceData {
  return parseProviderPrices(data, "Energi2");
}

function parseStockholmsEl(data: any): PriceData {
  return parseProviderPrices(data, "Stockholms El");
}

function parseSvealandsEl(data: any): PriceData {
  return parseProviderPrices(data, "Svealands EL");
}

function parseSvekraft(data: any): PriceData {
  return parseProviderPrices(data, "Svekraft");
}

function parseMotalaEl(data: any): PriceData {
  return parseProviderPrices(data, "Motala El");
}

// Funktion för att rensa dubbletter av leverantörer
async function cleanupDuplicateProviders(db: any) {
  try {
    const allProviders = await db.getAllProviders();
    
    // Gruppera leverantörer efter namn och avtalstyp
    const groupedProviders: Record<string, any[]> = {};
    
    allProviders.forEach((provider: any) => {
      const key = `${provider.name.toLowerCase()}_${provider.contractType}`;
      if (!groupedProviders[key]) {
        groupedProviders[key] = [];
      }
      groupedProviders[key].push(provider);
    });
    
    // Hitta och ta bort dubbletter
    for (const [key, providers] of Object.entries(groupedProviders)) {
      if (providers.length > 1) {
        console.log(`[Cleanup] Found ${providers.length} duplicates for ${key}`);
        
        // Sortera efter created_at (behåll den äldsta)
        providers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        const keepProvider = providers[0]; // Behåll den första (äldsta)
        const duplicateProviders = providers.slice(1); // Ta bort resten
        
        console.log(`[Cleanup] Keeping provider: ${keepProvider.name} (${keepProvider.id})`);
        
        // Ta bort dubbletter
        for (const duplicate of duplicateProviders) {
          console.log(`[Cleanup] Removing duplicate: ${duplicate.name} (${duplicate.id})`);
          await db.deleteProvider(duplicate.id);
        }
      }
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up duplicates:', error);
  }
}

// Funktion för att skapa rörliga leverantörer baserat på spotpriser
function createVariableProvidersFromSpotPrices(data: any, providerName: string): ContractAlternative[] {
  const spotPrices = data.spot_prices || {};
  const variableProviders: ContractAlternative[] = [];
  
  // Skapa en rörlig leverantör för varje prisområde
  Object.entries(spotPrices).forEach(([areaCode, spotPrice]: [string, any]) => {
    if (typeof spotPrice === 'number' && spotPrice > 0) {
      variableProviders.push({
        namn: `${providerName} Rörligt (${PRICE_AREAS[areaCode]?.name || areaCode.toUpperCase()})`,
        fastpris: undefined, // Rörligt har inget fastpris
        månadskostnad: 0, // Oftast ingen månadskostnad för rörliga avtal
        bindningstid: 0, // Ingen bindningstid för rörliga avtal
        gratis_månader: 0,
        spotpris: spotPrice / 100, // Konvertera från öre till kr
        påslag: 0 // Kan variera per leverantör
      });
    }
  });
  
  return variableProviders;
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

    // Hämta alla leverantörer från databasen (inklusive inaktiva för prisuppdatering)
    const existingProviders = await db.getAllProviders();
    console.log(`[Price Update] Found ${existingProviders.length} existing providers (including inactive)`);
    
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
          // Prioritera att hitta en befintlig leverantör istället för att skapa nya
          let provider = existingProviders.find(p => 
            p.name.toLowerCase() === endpoint.providerName.toLowerCase() &&
            p.contractType === "fastpris"
          );

          // Om vi inte hittar exakt match, prova mer flexibel sökning
          if (!provider) {
            provider = existingProviders.find(p => 
              (p.name.toLowerCase().includes(endpoint.providerName.toLowerCase()) ||
               p.name.toLowerCase().includes(endpoint.endpoint.split('_')[0])) &&
              p.contractType === "fastpris"
            );
          }

          // Om vi fortfarande inte hittar, kolla om det finns en dold fastpris-leverantör
          if (!provider) {
            provider = existingProviders.find(p => 
              (p.name.toLowerCase().includes(endpoint.providerName.toLowerCase()) ||
               p.name.toLowerCase().includes(endpoint.endpoint.split('_')[0])) &&
              p.contractType === "fastpris" &&
              p.userHidden === true
            );
          }

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
              features: Array.isArray(priceResponse.data.features) ? priceResponse.data.features : [`${endpoint.providerName} fastpris`],
              websiteUrl: `https://${endpoint.url.split('//')[1].split('/')[0]}`,
              phoneNumber: undefined,
              avtalsalternativ: Array.isArray(priceResponse.data.avtalsalternativ) ? priceResponse.data.avtalsalternativ : []
            });

            updateResults.push({
              provider: endpoint.providerName,
              action: 'created',
              success: true,
              data: newProvider
            });
            successCount++;

            // Logga antal avtalsalternativ som lagras i den enda leverantören
            if (priceResponse.data.avtalsalternativ && priceResponse.data.avtalsalternativ.length > 1) {
              console.log(`[Price Update] Storing ${priceResponse.data.avtalsalternativ.length} contract alternatives in single provider: ${endpoint.providerName}`);
            }
          } else {
            // Uppdatera befintlig Fastpris-leverantör (bara Fastpris!)
            console.log(`[Price Update] Found existing Fastpris provider: ${provider.name} (active: ${provider.isActive}, userHidden: ${provider.userHidden})`);
            
            // Om användaren dolt leverantören medvetet, respektera det och uppdatera bara priser
            if (provider.userHidden) {
              console.log(`[Price Update] Provider ${provider.name} was hidden by user, keeping it hidden but updating prices`);
              
              const updatedProvider = await db.updateProvider(provider.id, {
                monthlyFee: priceResponse.data.månadskostnad || provider.monthlyFee,
                energyPrice: priceResponse.data.fastpris || provider.energyPrice,
                features: priceResponse.data.features || provider.features,
                avtalsalternativ: priceResponse.data.avtalsalternativ || provider.avtalsalternativ || []
                // BEHÅLL isActive = false och userHidden = true
              });

              updateResults.push({
                provider: endpoint.providerName,
                action: 'updated_hidden',
                success: true,
                data: updatedProvider
              });
              successCount++;
            } else {
              // Om leverantören inte var dold av användaren, uppdatera och aktivera den
              console.log(`[Price Update] Updating and reactivating provider: ${provider.name}`);
              
              const updatedProvider = await db.updateProvider(provider.id, {
                monthlyFee: priceResponse.data.månadskostnad || provider.monthlyFee,
                energyPrice: priceResponse.data.fastpris || provider.energyPrice,
                features: priceResponse.data.features || provider.features,
                avtalsalternativ: priceResponse.data.avtalsalternativ || provider.avtalsalternativ || [],
                // AKTIVERA leverantören igen om den var inaktiv
                isActive: true
              });

              updateResults.push({
                provider: endpoint.providerName,
                action: provider.isActive ? 'updated' : 'reactivated',
                success: true,
                data: updatedProvider
              });
              successCount++;
            }
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

    // Rensa dubbletter av leverantörer efter prisuppdatering
    console.log(`[Price Update] Cleaning up duplicate providers...`);
    await cleanupDuplicateProviders(db);

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
