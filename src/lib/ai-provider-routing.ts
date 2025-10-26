// Provider Routing System - Routar till rätt AI baserat på leverantör
import { BillData } from './types';
import { identifyProvider } from './ai-provider-identification';
import { fortumAI } from './ai-fortum';
import { eonAI } from './ai-eon';
import { vattenfallAI } from './ai-vattenfall';
import { generalAI } from './ai-general';

export interface ProviderAI {
  name: string;
  analyze: (billImage: string) => Promise<BillData>;
}

export class ProviderRouter {
  private providers: Map<string, ProviderAI> = new Map();
  private fallbackAI!: ProviderAI;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Lägg till specialiserade AI:er
    this.providers.set('Fortum', {
      name: 'FortumAI',
      analyze: fortumAI.analyze.bind(fortumAI)
    });
    
    this.providers.set('E.ON', {
      name: 'EonAI', 
      analyze: eonAI.analyze.bind(eonAI)
    });
    
    this.providers.set('Vattenfall', {
      name: 'VattenfallAI',
      analyze: vattenfallAI.analyze.bind(vattenfallAI)
    });
    
    // Fallback för okända leverantörer
    this.fallbackAI = {
      name: 'GeneralAI',
      analyze: generalAI.analyze.bind(generalAI)
    };
  }

  async routeToProvider(billImage: string): Promise<BillData> {
    console.log('[Provider Router] Identifierar leverantör...');
    
    // 1. Identifiera leverantör
    const identification = await identifyProvider(billImage);
    console.log(`[Provider Router] Identifierad leverantör: ${identification.provider} (confidence: ${identification.confidence})`);
    console.log(`[Provider Router] Reasoning: ${identification.reasoning}`);

    // 2. Välj rätt AI
    const providerAI = this.providers.get(identification.provider);
    
    if (providerAI && identification.confidence > 0.7) {
      console.log(`[Provider Router] Använder specialiserad AI för ${identification.provider}`);
      return await providerAI.analyze(billImage);
    } else {
      console.log(`[Provider Router] Använder generell AI (confidence: ${identification.confidence})`);
      return await this.fallbackAI.analyze(billImage);
    }
  }


  // Metod för att lägga till nya leverantörer
  addProvider(providerName: string, ai: ProviderAI) {
    this.providers.set(providerName, ai);
    console.log(`[Provider Router] Lagt till AI för ${providerName}`);
  }

  // Metod för att lista alla tillgängliga leverantörer
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
export const providerRouter = new ProviderRouter();
