// Database abstraction layer för Elbespararen v7
// Stöder både mock data (nu) och Cloudflare D1 (framtida)

import { ElectricityProvider, Lead, SwitchRequest } from "@/lib/types";

// Mock data för utveckling
const mockProviders: ElectricityProvider[] = [
  {
    id: "cheap-energy-1",
    name: "Cheap Energy",
    description: "Billigaste alternativet med 0 kr i månadskostnad och 0 kr de första 12 månaderna",
    monthlyFee: 0,
    energyPrice: 0.45,
    freeMonths: 12,
    contractLength: 12,
    isActive: true,
    features: [
      "0 kr månadskostnad",
      "0 kr de första 12 månaderna", 
      "Ingen bindningstid",
      "Spotpris + 0 kr påslag"
    ],
    logoUrl: "/logos/cheap-energy.png",
    websiteUrl: "https://cheapenergy.se",
    phoneNumber: "08-123 45 67",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "green-power-2",
    name: "Green Power",
    description: "Miljövänlig el med 100% förnybar energi",
    monthlyFee: 29,
    energyPrice: 0.52,
    freeMonths: 0,
    contractLength: 24,
    isActive: true,
    features: [
      "100% förnybar energi",
      "Låg månadskostnad",
      "Miljöcertifierat",
      "24 månaders bindningstid"
    ],
    logoUrl: "/logos/green-power.png",
    websiteUrl: "https://greenpower.se",
    phoneNumber: "08-234 56 78",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
];

// Database interface
export interface Database {
  // Providers
  getProviders(): Promise<ElectricityProvider[]>;
  getProvider(id: string): Promise<ElectricityProvider | null>;
  createProvider(provider: Omit<ElectricityProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ElectricityProvider>;
  updateProvider(id: string, provider: Partial<ElectricityProvider>): Promise<ElectricityProvider>;
  deleteProvider(id: string): Promise<boolean>;
  
  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  createLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead>;
  updateLead(id: string, lead: Partial<Lead>): Promise<Lead>;
  deleteLead(id: string): Promise<boolean>;

  // Switch Requests
  getSwitchRequests(): Promise<SwitchRequest[]>;
  getSwitchRequest(id: string): Promise<SwitchRequest | null>;
  createSwitchRequest(switchRequest: Omit<SwitchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SwitchRequest>;
  updateSwitchRequest(id: string, switchRequest: Partial<SwitchRequest>): Promise<SwitchRequest>;
  deleteSwitchRequest(id: string): Promise<boolean>;
}

// Mock Database Implementation (för utveckling)
class MockDatabase implements Database {
  private providers: ElectricityProvider[] = [...mockProviders];
  private leads: Lead[] = [];
  private switchRequests: SwitchRequest[] = [];

  async getProviders(): Promise<ElectricityProvider[]> {
    return [...this.providers];
  }

  async getProvider(id: string): Promise<ElectricityProvider | null> {
    return this.providers.find(p => p.id === id) || null;
  }

  async createProvider(providerData: Omit<ElectricityProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ElectricityProvider> {
    const provider: ElectricityProvider = {
      ...providerData,
      id: `provider-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.providers.push(provider);
    return provider;
  }

  async updateProvider(id: string, providerData: Partial<ElectricityProvider>): Promise<ElectricityProvider> {
    const index = this.providers.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Provider with id ${id} not found`);
    }
    
    this.providers[index] = {
      ...this.providers[index],
      ...providerData,
      updatedAt: new Date()
    };
    
    return this.providers[index];
  }

  async deleteProvider(id: string): Promise<boolean> {
    const index = this.providers.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }
    this.providers.splice(index, 1);
    return true;
  }

  async getLeads(): Promise<Lead[]> {
    return [...this.leads];
  }

  async getLead(id: string): Promise<Lead | null> {
    return this.leads.find(l => l.id === id) || null;
  }

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const lead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: new Date()
    };
    this.leads.push(lead);
    return lead;
  }

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Lead with id ${id} not found`);
    }
    
    this.leads[index] = {
      ...this.leads[index],
      ...leadData
    };
    
    return this.leads[index];
  }

  async deleteLead(id: string): Promise<boolean> {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) {
      return false;
    }
    this.leads.splice(index, 1);
    return true;
  }

  // Switch Request methods
  async getSwitchRequests(): Promise<SwitchRequest[]> {
    return [...this.switchRequests];
  }

  async getSwitchRequest(id: string): Promise<SwitchRequest | null> {
    return this.switchRequests.find(sr => sr.id === id) || null;
  }

  async createSwitchRequest(switchRequestData: Omit<SwitchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SwitchRequest> {
    const switchRequest: SwitchRequest = {
      ...switchRequestData,
      id: `switch-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.switchRequests.push(switchRequest);
    return switchRequest;
  }

  async updateSwitchRequest(id: string, switchRequestData: Partial<SwitchRequest>): Promise<SwitchRequest> {
    const index = this.switchRequests.findIndex(sr => sr.id === id);
    if (index === -1) {
      throw new Error(`Switch request with id ${id} not found`);
    }
    
    this.switchRequests[index] = {
      ...this.switchRequests[index],
      ...switchRequestData,
      updatedAt: new Date()
    };
    
    return this.switchRequests[index];
  }

  async deleteSwitchRequest(id: string): Promise<boolean> {
    const index = this.switchRequests.findIndex(sr => sr.id === id);
    if (index === -1) {
      return false;
    }
    this.switchRequests.splice(index, 1);
    return true;
  }
}

// Cloudflare D1 Database Implementation (för produktion)
class CloudflareDatabase implements Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getProviders(): Promise<ElectricityProvider[]> {
    const result = await this.db.prepare(`
      SELECT * FROM electricity_providers 
      WHERE is_active = 1 
      ORDER BY energy_price ASC
    `).all();

    return result.results.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      monthlyFee: Number(row.monthly_fee),
      energyPrice: Number(row.energy_price),
      freeMonths: Number(row.free_months),
      contractLength: Number(row.contract_length),
      isActive: Boolean(row.is_active),
      features: JSON.parse(String(row.features || '[]')) as string[],
      logoUrl: row.logo_url ? String(row.logo_url) : undefined,
      websiteUrl: row.website_url ? String(row.website_url) : undefined,
      phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    }));
  }

  async getProvider(id: string): Promise<ElectricityProvider | null> {
    const result = await this.db.prepare(`
      SELECT * FROM electricity_providers WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    const row = result as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      monthlyFee: Number(row.monthly_fee),
      energyPrice: Number(row.energy_price),
      freeMonths: Number(row.free_months),
      contractLength: Number(row.contract_length),
      isActive: Boolean(row.is_active),
      features: JSON.parse(String(row.features || '[]')) as string[],
      logoUrl: row.logo_url ? String(row.logo_url) : undefined,
      websiteUrl: row.website_url ? String(row.website_url) : undefined,
      phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  async createProvider(providerData: Omit<ElectricityProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ElectricityProvider> {
    const id = `provider-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO electricity_providers (
        id, name, description, monthly_fee, energy_price, free_months, 
        contract_length, is_active, features, logo_url, website_url, 
        phone_number, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      providerData.name,
      providerData.description,
      providerData.monthlyFee,
      providerData.energyPrice,
      providerData.freeMonths,
      providerData.contractLength,
      providerData.isActive ? 1 : 0,
      JSON.stringify(providerData.features),
      providerData.logoUrl,
      providerData.websiteUrl,
      providerData.phoneNumber,
      now,
      now
    ).run();

    return {
      ...providerData,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async updateProvider(id: string, providerData: Partial<ElectricityProvider>): Promise<ElectricityProvider> {
    const existing = await this.getProvider(id);
    if (!existing) {
      throw new Error(`Provider with id ${id} not found`);
    }

    const updated = { ...existing, ...providerData, updatedAt: new Date() };
    const now = updated.updatedAt.toISOString();

    await this.db.prepare(`
      UPDATE electricity_providers SET
        name = ?, description = ?, monthly_fee = ?, energy_price = ?,
        free_months = ?, contract_length = ?, is_active = ?, features = ?,
        logo_url = ?, website_url = ?, phone_number = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      updated.name,
      updated.description,
      updated.monthlyFee,
      updated.energyPrice,
      updated.freeMonths,
      updated.contractLength,
      updated.isActive ? 1 : 0,
      JSON.stringify(updated.features),
      updated.logoUrl,
      updated.websiteUrl,
      updated.phoneNumber,
      now,
      id
    ).run();

    return updated;
  }

  async deleteProvider(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM electricity_providers WHERE id = ?
    `).bind(id).run();

    return (result.meta?.changes || 0) > 0;
  }

  // Lead methods (simplified for now)
  async getLeads(): Promise<Lead[]> {
    // TODO: Implementera när vi behöver leads
    return [];
  }

  async getLead(): Promise<Lead | null> {
    // TODO: Implementera när vi behöver leads
    return null;
  }

  async createLead(): Promise<Lead> {
    // TODO: Implementera när vi behöver leads
    throw new Error("Not implemented yet");
  }

  async updateLead(): Promise<Lead> {
    // TODO: Implementera när vi behöver leads
    throw new Error("Not implemented yet");
  }

  async deleteLead(): Promise<boolean> {
    // TODO: Implementera när vi behöver leads
    return false;
  }

  // Switch Request methods
  async getSwitchRequests(): Promise<SwitchRequest[]> {
    const result = await this.db.prepare(`
      SELECT * FROM switch_requests 
      ORDER BY created_at DESC
    `).all();

    return result.results.map((row: Record<string, unknown>) => {
      const customerInfo = JSON.parse(String(row.customer_info));
      const address = JSON.parse(String(row.address));
      
      return {
        id: String(row.id),
        customerInfo: { ...customerInfo, address },
        currentProvider: JSON.parse(String(row.current_provider)),
        newProvider: JSON.parse(String(row.new_provider)),
        billData: JSON.parse(String(row.bill_data)),
        savings: JSON.parse(String(row.savings)),
        status: String(row.status) as SwitchRequest['status'],
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at))
      };
    });
  }

  async getSwitchRequest(id: string): Promise<SwitchRequest | null> {
    const result = await this.db.prepare(`
      SELECT * FROM switch_requests WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    const row = result as Record<string, unknown>;
    const customerInfo = JSON.parse(String(row.customer_info));
    const address = JSON.parse(String(row.address));
    
    return {
      id: String(row.id),
      customerInfo: { ...customerInfo, address },
      currentProvider: JSON.parse(String(row.current_provider)),
      newProvider: JSON.parse(String(row.new_provider)),
      billData: JSON.parse(String(row.bill_data)),
      savings: JSON.parse(String(row.savings)),
      status: String(row.status) as SwitchRequest['status'],
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  async createSwitchRequest(switchRequestData: Omit<SwitchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SwitchRequest> {
    const id = `switch-${Date.now()}`;
    const now = new Date().toISOString();

    const { address, ...customerInfoWithoutAddress } = switchRequestData.customerInfo;
    
    await this.db.prepare(`
      INSERT INTO switch_requests (
        id, customer_info, address, current_provider, new_provider,
        bill_data, savings, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      JSON.stringify(customerInfoWithoutAddress),
      JSON.stringify(address),
      JSON.stringify(switchRequestData.currentProvider),
      JSON.stringify(switchRequestData.newProvider),
      JSON.stringify(switchRequestData.billData),
      JSON.stringify(switchRequestData.savings),
      switchRequestData.status,
      switchRequestData.notes || null,
      now,
      now
    ).run();

    return {
      ...switchRequestData,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async updateSwitchRequest(id: string, switchRequestData: Partial<SwitchRequest>): Promise<SwitchRequest> {
    const existing = await this.getSwitchRequest(id);
    if (!existing) {
      throw new Error(`Switch request with id ${id} not found`);
    }

    const updated = { ...existing, ...switchRequestData, updatedAt: new Date() };
    const now = updated.updatedAt.toISOString();
    
    const { address, ...customerInfoWithoutAddress } = updated.customerInfo;

    await this.db.prepare(`
      UPDATE switch_requests SET
        customer_info = ?, address = ?, current_provider = ?, new_provider = ?,
        bill_data = ?, savings = ?, status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(customerInfoWithoutAddress),
      JSON.stringify(address),
      JSON.stringify(updated.currentProvider),
      JSON.stringify(updated.newProvider),
      JSON.stringify(updated.billData),
      JSON.stringify(updated.savings),
      updated.status,
      updated.notes || null,
      now,
      id
    ).run();

    return updated;
  }

  async deleteSwitchRequest(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM switch_requests WHERE id = ?
    `).bind(id).run();

    return (result.meta?.changes || 0) > 0;
  }
}

// Database factory
export function createDatabase(): Database {
  // I utveckling, använd mock database
  if (process.env.NODE_ENV === 'development') {
    return new MockDatabase();
  }

  // I produktion med Cloudflare, använd D1
  if (typeof process.env.DB !== 'undefined') {
    return new CloudflareDatabase(process.env.DB as unknown as D1Database);
  }

  // Fallback till mock
  return new MockDatabase();
}

// Export singleton instance
export const db = createDatabase();
