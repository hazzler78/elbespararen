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

    return result.results.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      monthlyFee: row.monthly_fee,
      energyPrice: row.energy_price,
      freeMonths: row.free_months,
      contractLength: row.contract_length,
      isActive: Boolean(row.is_active),
      features: JSON.parse(row.features || '[]'),
      logoUrl: row.logo_url,
      websiteUrl: row.website_url,
      phoneNumber: row.phone_number,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  async getProvider(id: string): Promise<ElectricityProvider | null> {
    const result = await this.db.prepare(`
      SELECT * FROM electricity_providers WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      monthlyFee: result.monthly_fee,
      energyPrice: result.energy_price,
      freeMonths: result.free_months,
      contractLength: result.contract_length,
      isActive: Boolean(result.is_active),
      features: JSON.parse(result.features || '[]'),
      logoUrl: result.logo_url,
      websiteUrl: result.website_url,
      phoneNumber: result.phone_number,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at)
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

    return result.changes > 0;
  }

  // Lead methods (simplified for now)
  async getLeads(): Promise<Lead[]> {
    // TODO: Implementera när vi behöver leads
    return [];
  }

  async getLead(id: string): Promise<Lead | null> {
    // TODO: Implementera när vi behöver leads
    return null;
  }

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    // TODO: Implementera när vi behöver leads
    throw new Error("Not implemented yet");
  }

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    // TODO: Implementera när vi behöver leads
    throw new Error("Not implemented yet");
  }

  async deleteLead(id: string): Promise<boolean> {
    // TODO: Implementera när vi behöver leads
    return false;
  }

  // Switch Request methods
  async getSwitchRequests(): Promise<SwitchRequest[]> {
    const result = await this.db.prepare(`
      SELECT * FROM switch_requests 
      ORDER BY created_at DESC
    `).all();

    return result.results.map((row: any) => ({
      id: row.id,
      customerInfo: JSON.parse(row.customer_info),
      address: JSON.parse(row.address),
      currentProvider: JSON.parse(row.current_provider),
      newProvider: JSON.parse(row.new_provider),
      billData: JSON.parse(row.bill_data),
      savings: JSON.parse(row.savings),
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  async getSwitchRequest(id: string): Promise<SwitchRequest | null> {
    const result = await this.db.prepare(`
      SELECT * FROM switch_requests WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    return {
      id: result.id,
      customerInfo: JSON.parse(result.customer_info),
      address: JSON.parse(result.address),
      currentProvider: JSON.parse(result.current_provider),
      newProvider: JSON.parse(result.new_provider),
      billData: JSON.parse(result.bill_data),
      savings: JSON.parse(result.savings),
      status: result.status,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at)
    };
  }

  async createSwitchRequest(switchRequestData: Omit<SwitchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SwitchRequest> {
    const id = `switch-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO switch_requests (
        id, customer_info, address, current_provider, new_provider,
        bill_data, savings, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      JSON.stringify(switchRequestData.customerInfo),
      JSON.stringify(switchRequestData.address),
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

    await this.db.prepare(`
      UPDATE switch_requests SET
        customer_info = ?, address = ?, current_provider = ?, new_provider = ?,
        bill_data = ?, savings = ?, status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(updated.customerInfo),
      JSON.stringify(updated.address),
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

    return result.changes > 0;
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
    return new CloudflareDatabase(process.env.DB as D1Database);
  }

  // Fallback till mock
  return new MockDatabase();
}

// Export singleton instance
export const db = createDatabase();
