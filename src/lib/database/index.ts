// Database abstraction layer för Elbespararen v7
// Stöder både mock data (nu) och Cloudflare D1 (framtida)

import { ElectricityProvider, Lead, SwitchRequest } from "@/lib/types";
import type { D1Database } from "@cloudflare/workers-types";

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
    contractType: "rörligt",
    isActive: true,
    userHidden: false,
    features: [
      "0 kr månadskostnad",
      "0 kr de första 12 månaderna", 
      "Ingen bindningstid",
      "Spotpris + 0 kr påslag"
    ],
    logoUrl: "/logos/cheap-energy.png",
    websiteUrl: "https://cheapenergy.se",
    affiliateUrl: undefined,
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
    contractType: "rörligt",
    isActive: true,
    userHidden: false,
    features: [
      "100% förnybar energi",
      "Låg månadskostnad",
      "Miljöcertifierat",
      "24 månaders bindningstid"
    ],
    logoUrl: "/logos/green-power.png",
    websiteUrl: "https://greenpower.se",
    affiliateUrl: undefined,
    phoneNumber: "08-234 56 78",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
];

// Database interface
export interface Database {
  // Providers
  getProviders(): Promise<ElectricityProvider[]>;
  getAllProviders(): Promise<ElectricityProvider[]>;
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
  private static instance: MockDatabase | null = null;
  private providers: ElectricityProvider[] = [...mockProviders];
  private leads: Lead[] = [];
  private switchRequests: SwitchRequest[] = [];

  // Singleton pattern för att behålla state mellan requests i utveckling
  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
    }
    return MockDatabase.instance;
  }

  async getProviders(): Promise<ElectricityProvider[]> {
    return [...this.providers];
  }

  async getAllProviders(): Promise<ElectricityProvider[]> {
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
      contractType: (row.contract_type as "rörligt" | "fastpris") || "rörligt",
      isActive: Boolean(row.is_active),
      userHidden: Boolean(row.user_hidden || false),
      features: JSON.parse(String(row.features || '[]')) as string[],
      logoUrl: row.logo_url ? String(row.logo_url) : undefined,
      websiteUrl: row.website_url ? String(row.website_url) : undefined,
      affiliateUrl: row.affiliate_url ? String(row.affiliate_url) : undefined,
      phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
      avtalsalternativ: row.avtalsalternativ ? JSON.parse(String(row.avtalsalternativ)) : undefined,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    }));
  }

  async getAllProviders(): Promise<ElectricityProvider[]> {
    const result = await this.db.prepare(`
      SELECT * FROM electricity_providers 
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
      contractType: (row.contract_type as "rörligt" | "fastpris") || "rörligt",
      isActive: Boolean(row.is_active),
      userHidden: Boolean(row.user_hidden || false),
      features: JSON.parse(String(row.features || '[]')) as string[],
      logoUrl: row.logo_url ? String(row.logo_url) : undefined,
      websiteUrl: row.website_url ? String(row.website_url) : undefined,
      affiliateUrl: row.affiliate_url ? String(row.affiliate_url) : undefined,
      phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
      avtalsalternativ: row.avtalsalternativ ? JSON.parse(String(row.avtalsalternativ)) : undefined,
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
      contractType: (row.contract_type as "rörligt" | "fastpris") || "rörligt",
      isActive: Boolean(row.is_active),
      userHidden: Boolean(row.user_hidden || false),
      features: JSON.parse(String(row.features || '[]')) as string[],
      logoUrl: row.logo_url ? String(row.logo_url) : undefined,
      websiteUrl: row.website_url ? String(row.website_url) : undefined,
      affiliateUrl: row.affiliate_url ? String(row.affiliate_url) : undefined,
      phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
      avtalsalternativ: row.avtalsalternativ ? JSON.parse(String(row.avtalsalternativ)) : undefined,
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
              contract_length, contract_type, is_active, user_hidden, features, logo_url, website_url, 
              affiliate_url, phone_number, avtalsalternativ, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            providerData.name,
            providerData.description,
            providerData.monthlyFee,
            providerData.energyPrice,
            providerData.freeMonths,
            providerData.contractLength,
            providerData.contractType,
            providerData.isActive ? 1 : 0,
            providerData.userHidden ? 1 : 0,
            JSON.stringify(providerData.features),
            providerData.logoUrl || null,
            providerData.websiteUrl || null,
            providerData.affiliateUrl || null,
            providerData.phoneNumber || null,
            JSON.stringify(providerData.avtalsalternativ || []),
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

    try {
      // Build dynamic SQL query based on what fields are being updated
      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      // Only include fields that are actually being updated
      if (providerData.name !== undefined) {
        fieldsToUpdate.push('name = ?');
        values.push(providerData.name);
      }
      if (providerData.description !== undefined) {
        fieldsToUpdate.push('description = ?');
        values.push(providerData.description);
      }
      if (providerData.monthlyFee !== undefined) {
        fieldsToUpdate.push('monthly_fee = ?');
        values.push(providerData.monthlyFee);
      }
      if (providerData.energyPrice !== undefined) {
        fieldsToUpdate.push('energy_price = ?');
        values.push(providerData.energyPrice);
      }
      if (providerData.freeMonths !== undefined) {
        fieldsToUpdate.push('free_months = ?');
        values.push(providerData.freeMonths);
      }
      if (providerData.contractLength !== undefined) {
        fieldsToUpdate.push('contract_length = ?');
        values.push(providerData.contractLength);
      }
      if (providerData.contractType !== undefined) {
        fieldsToUpdate.push('contract_type = ?');
        values.push(providerData.contractType);
      }
      if (providerData.isActive !== undefined) {
        fieldsToUpdate.push('is_active = ?');
        values.push(providerData.isActive ? 1 : 0);
      }
      if (providerData.userHidden !== undefined) {
        fieldsToUpdate.push('user_hidden = ?');
        values.push(providerData.userHidden ? 1 : 0);
      }
      if (providerData.features !== undefined) {
        fieldsToUpdate.push('features = ?');
        values.push(JSON.stringify(providerData.features));
      }
      if (providerData.logoUrl !== undefined) {
        fieldsToUpdate.push('logo_url = ?');
        values.push(providerData.logoUrl || null);
      }
      if (providerData.websiteUrl !== undefined) {
        fieldsToUpdate.push('website_url = ?');
        values.push(providerData.websiteUrl || null);
      }
      if (providerData.affiliateUrl !== undefined) {
        fieldsToUpdate.push('affiliate_url = ?');
        values.push(providerData.affiliateUrl || null);
      }
      if (providerData.phoneNumber !== undefined) {
        fieldsToUpdate.push('phone_number = ?');
        values.push(providerData.phoneNumber || null);
      }
      if (providerData.avtalsalternativ !== undefined) {
        fieldsToUpdate.push('avtalsalternativ = ?');
        values.push(JSON.stringify(providerData.avtalsalternativ || []));
      }

      // Always update the timestamp
      fieldsToUpdate.push('updated_at = ?');
      values.push(now);

      if (fieldsToUpdate.length === 1) { // Only timestamp
        throw new Error('No fields to update');
      }

      const sql = `UPDATE electricity_providers SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
      values.push(id);

      console.log('[Database] updateProvider SQL:', sql);
      console.log('[Database] updateProvider values:', values);

      const result = await this.db.prepare(sql).bind(...values).run();

      console.log('[Database] updateProvider result:', result);
      
      if (result.meta?.changes === 0) {
        throw new Error(`No rows were updated for provider ${id}`);
      }

      return updated;
    } catch (error) {
      console.error('[Database] updateProvider error:', error);
      console.error('[Database] Provider data:', updated);
      throw error;
    }
  }

  async deleteProvider(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM electricity_providers WHERE id = ?
    `).bind(id).run();

    return (result.meta?.changes || 0) > 0;
  }

  // Lead methods
  async getLeads(): Promise<Lead[]> {
    const result = await this.db.prepare(`
      SELECT * FROM leads 
      ORDER BY created_at DESC
    `).all();

    return result.results.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      billData: JSON.parse(String(row.bill_data)),
      savings: JSON.parse(String(row.savings_data)),
      status: String(row.status) as Lead['status'],
      createdAt: new Date(String(row.created_at))
    }));
  }

  async getLead(id: string): Promise<Lead | null> {
    const result = await this.db.prepare(`
      SELECT * FROM leads WHERE id = ?
    `).bind(id).first();

    if (!result) return null;

    const row = result as Record<string, unknown>;
    return {
      id: String(row.id),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      billData: JSON.parse(String(row.bill_data)),
      savings: JSON.parse(String(row.savings_data)),
      status: String(row.status) as Lead['status'],
      createdAt: new Date(String(row.created_at))
    };
  }

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const id = `lead-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO leads (
        id, email, phone, bill_data, savings_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      leadData.email,
      leadData.phone,
      JSON.stringify(leadData.billData),
      JSON.stringify(leadData.savings),
      leadData.status,
      now
    ).run();

    return {
      ...leadData,
      id,
      createdAt: new Date(now)
    };
  }

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    const existing = await this.getLead(id);
    if (!existing) {
      throw new Error(`Lead with id ${id} not found`);
    }

    const updated = { ...existing, ...leadData };
    const now = new Date().toISOString();

    await this.db.prepare(`
      UPDATE leads SET
        email = ?, phone = ?, bill_data = ?, savings_data = ?, status = ?
      WHERE id = ?
    `).bind(
      updated.email,
      updated.phone,
      JSON.stringify(updated.billData),
      JSON.stringify(updated.savings),
      updated.status,
      id
    ).run();

    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM leads WHERE id = ?
    `).bind(id).run();

    return (result.meta?.changes || 0) > 0;
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
        notes: row.notes ? String(row.notes) : undefined,
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
      notes: row.notes ? String(row.notes) : undefined,
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
    const safeStatus = updated.status ?? 'pending';
    
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
      safeStatus,
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
  // Behåll lokal mock i utveckling när ingen D1-binding finns
  if (process.env.NODE_ENV === 'development') {
    return MockDatabase.getInstance();
  }

  // För bakåtkompatibilitet om DB exponeras som env-variabel i Node-miljö
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && typeof (process.env as unknown as Record<string, unknown>).DB !== 'undefined') {
    return new CloudflareDatabase((process.env as unknown as Record<string, unknown>).DB as unknown as D1Database);
  }

  throw new Error('[Database] No D1 database available - D1 database is required for production');
}

// Factory för Cloudflare Pages/Workers där DB finns i request context
export function createDatabaseFromBinding(binding: unknown): Database {
  if (binding) {
    console.log('[Database] Using CloudflareDatabase with D1 binding');
    return new CloudflareDatabase(binding as D1Database);
  }
  // Fallback till mock database i utveckling
  console.log('[Database] No D1 binding, using MockDatabase in development');
  return MockDatabase.getInstance();
}

// Exportera inte en global singleton för att undvika felaktig miljö i Edge-runtime
// Konsumenter bör anropa createDatabaseFromBinding(...) per request
