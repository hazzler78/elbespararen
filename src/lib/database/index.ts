// Database abstraction layer för Elbespararen v7
// Stöder både mock data (nu) och Cloudflare D1 (framtida)

import { ElectricityProvider, Lead, SwitchRequest, NewsPost, ChatMessage, PostalCodeAnalytics, BillAnalysis, User, UserStats } from "@/lib/types";
import type { CloudflareD1Database } from "@/types/cloudflare";

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
    customerType: "private",
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
    customerType: "private",
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
  getProviders(customerType?: "private" | "business"): Promise<ElectricityProvider[]>;
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

  // News Posts
  getNewsPosts(includeUnpublished?: boolean): Promise<NewsPost[]>;
  getNewsPost(id: string): Promise<NewsPost | null>;
  createNewsPost(newsPost: Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsPost>;
  updateNewsPost(id: string, newsPost: Partial<NewsPost>): Promise<NewsPost>;
  deleteNewsPost(id: string): Promise<boolean>;

  // Chat Messages
  getChatMessages(sessionId?: string, limit?: number, searchTerm?: string): Promise<ChatMessage[]>;
  getChatMessage(id: string): Promise<ChatMessage | null>;
  createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;

  // Postal Code Analytics
  createPostalCodeAnalytics(analytics: Omit<PostalCodeAnalytics, 'id' | 'createdAt'>): Promise<PostalCodeAnalytics>;
  getPostalCodeAnalytics(limit?: number): Promise<PostalCodeAnalytics[]>;

  // Bill Analyses
  getBillAnalyses(limit?: number, validationStatus?: BillAnalysis['validationStatus']): Promise<BillAnalysis[]>;
  getBillAnalysis(id: string): Promise<BillAnalysis | null>;
  createBillAnalysis(analysis: Omit<BillAnalysis, 'id' | 'createdAt'>): Promise<BillAnalysis>;
  updateBillAnalysis(id: string, analysis: Partial<BillAnalysis>): Promise<BillAnalysis>;
  deleteBillAnalysis(id: string): Promise<boolean>;
  getBillAnalysesByUserId(userId: string, range?: string): Promise<BillAnalysis[]>;

  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createOrUpdateUser(userData: { email: string; name?: string; image?: string; googleId?: string }): Promise<User>;
  getUserStats(userId: string): Promise<UserStats>;
}

// Mock Database Implementation (för utveckling)
class MockDatabase implements Database {
  private static instance: MockDatabase | null = null;
  private providers: ElectricityProvider[] = [...mockProviders];
  private leads: Lead[] = [];
  private switchRequests: SwitchRequest[] = [];
  private newsPosts: NewsPost[] = [];
  private chatMessages: ChatMessage[] = [];
  private postalCodeAnalytics: PostalCodeAnalytics[] = [];
  private billAnalyses: BillAnalysis[] = [];
  public bestChoiceProviderId: string | null = null; // För settings API

  // Singleton pattern för att behålla state mellan requests i utveckling
  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
    }
    return MockDatabase.instance;
  }

  async getProviders(customerType: "private" | "business" = "private"): Promise<ElectricityProvider[]> {
    return this.providers
      .filter(provider => provider.isActive)
      .filter(provider => (provider.customerType ?? "private") === customerType)
      .map(provider => ({ ...provider }));
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
      customerType: providerData.customerType ?? "private",
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

  // News Post methods
  async getNewsPosts(includeUnpublished: boolean = false): Promise<NewsPost[]> {
    let posts = [...this.newsPosts];
    if (!includeUnpublished) {
      posts = posts.filter(p => p.isPublished);
    }
    return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async getNewsPost(id: string): Promise<NewsPost | null> {
    return this.newsPosts.find(p => p.id === id) || null;
  }

  async createNewsPost(newsPostData: Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsPost> {
    const newsPost: NewsPost = {
      ...newsPostData,
      id: `news-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.newsPosts.push(newsPost);
    return newsPost;
  }

  async updateNewsPost(id: string, newsPostData: Partial<NewsPost>): Promise<NewsPost> {
    const index = this.newsPosts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`News post with id ${id} not found`);
    }
    
    this.newsPosts[index] = {
      ...this.newsPosts[index],
      ...newsPostData,
      updatedAt: new Date()
    };
    
    return this.newsPosts[index];
  }

  async deleteNewsPost(id: string): Promise<boolean> {
    const index = this.newsPosts.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }
    this.newsPosts.splice(index, 1);
    return true;
  }

  // Chat Messages
  async getChatMessages(sessionId?: string, limit?: number, searchTerm?: string): Promise<ChatMessage[]> {
    let messages = [...this.chatMessages];
    
    if (sessionId) {
      messages = messages.filter(m => m.sessionId === sessionId);
    }
    
    // Sök i innehåll om searchTerm finns
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      messages = messages.filter(m => 
        m.content.toLowerCase().includes(searchLower)
      );
    }
    
    // Sortera efter datum (nyaste först)
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      messages = messages.slice(0, limit);
    }
    
    return messages;
  }

  async getChatMessage(id: string): Promise<ChatMessage | null> {
    return this.chatMessages.find(m => m.id === id) || null;
  }

  async createChatMessage(messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...messageData,
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    this.chatMessages.push(message);
    return message;
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    const index = this.chatMessages.findIndex(m => m.id === id);
    if (index === -1) {
      return false;
    }
    this.chatMessages.splice(index, 1);
    return true;
  }

  // Postal Code Analytics methods
  async createPostalCodeAnalytics(analyticsData: Omit<PostalCodeAnalytics, 'id' | 'createdAt'>): Promise<PostalCodeAnalytics> {
    const analytics: PostalCodeAnalytics = {
      ...analyticsData,
      id: `postal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    this.postalCodeAnalytics.push(analytics);
    return analytics;
  }

  async getPostalCodeAnalytics(limit?: number): Promise<PostalCodeAnalytics[]> {
    let analytics = [...this.postalCodeAnalytics];
    
    // Sortera efter datum (nyaste först)
    analytics.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      analytics = analytics.slice(0, limit);
    }
    
    return analytics;
  }

  // Bill Analyses methods
  async getBillAnalyses(limit?: number, validationStatus?: BillAnalysis['validationStatus']): Promise<BillAnalysis[]> {
    let analyses = [...this.billAnalyses];
    
    // Filtrera på validation status om angivet
    if (validationStatus) {
      analyses = analyses.filter(a => a.validationStatus === validationStatus);
    }
    
    // Sortera efter datum (nyaste först)
    analyses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      analyses = analyses.slice(0, limit);
    }
    
    return analyses;
  }

  async getBillAnalysis(id: string): Promise<BillAnalysis | null> {
    return this.billAnalyses.find(a => a.id === id) || null;
  }

  async createBillAnalysis(analysisData: Omit<BillAnalysis, 'id' | 'createdAt'>): Promise<BillAnalysis> {
    const analysis: BillAnalysis = {
      ...analysisData,
      id: `bill-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    this.billAnalyses.push(analysis);
    return analysis;
  }

  async updateBillAnalysis(id: string, analysisData: Partial<BillAnalysis>): Promise<BillAnalysis> {
    const index = this.billAnalyses.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Bill analysis with id ${id} not found`);
    }
    
    this.billAnalyses[index] = {
      ...this.billAnalyses[index],
      ...analysisData
    };
    
    return this.billAnalyses[index];
  }

  async deleteBillAnalysis(id: string): Promise<boolean> {
    const index = this.billAnalyses.findIndex(a => a.id === id);
    if (index === -1) {
      return false;
    }
    this.billAnalyses.splice(index, 1);
    return true;
  }

  async getBillAnalysesByUserId(userId: string, range: string = 'year'): Promise<BillAnalysis[]> {
    // Filter by user_id and date range
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (range) {
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate = new Date(0); // All time
    }
    
    return this.billAnalyses
      .filter(a => {
        // In mock, we'll just return all for now
        // In real implementation, filter by user_id
        return a.createdAt >= cutoffDate;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Users
  private users: User[] = [];

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async createOrUpdateUser(userData: { email: string; name?: string; image?: string; googleId?: string }): Promise<User> {
    const existing = this.users.find(u => u.email === userData.email);
    const now = new Date();
    
    if (existing) {
      // Update existing user
      existing.name = userData.name || existing.name;
      existing.image = userData.image || existing.image;
      existing.googleId = userData.googleId || existing.googleId;
      existing.updatedAt = now;
      return existing;
    } else {
      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        googleId: userData.googleId,
        subscriptionTier: 'free', // Default to free
        createdAt: now,
        updatedAt: now
      };
      this.users.push(newUser);
      return newUser;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const userAnalyses = this.billAnalyses; // In mock, use all analyses
    
    if (userAnalyses.length === 0) {
      return {
        totalAnalyses: 0,
        totalSavings: 0,
        averageSavings: 0,
        currentMonthlyCost: 0,
        lastAnalysisDate: null,
        trend: 'stable',
        benchmarkComparison: {
          percentile: 50,
          averageInArea: 0,
          yourCost: 0
        }
      };
    }

    const totalSavings = userAnalyses.reduce((sum, a) => sum + a.savings.potentialSavings, 0);
    const avgSavings = totalSavings / userAnalyses.length;
    const latestCost = userAnalyses[0]?.billData.totalAmount || 0;
    const lastDate = userAnalyses[0]?.createdAt.toISOString() || null;

    // Simple trend calculation
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (userAnalyses.length >= 2) {
      const recent = userAnalyses[0].billData.totalAmount;
      const previous = userAnalyses[1].billData.totalAmount;
      if (recent > previous) trend = 'up';
      else if (recent < previous) trend = 'down';
    }

    return {
      totalAnalyses: userAnalyses.length,
      totalSavings,
      averageSavings: avgSavings,
      currentMonthlyCost: latestCost,
      lastAnalysisDate: lastDate,
      trend,
      benchmarkComparison: {
        percentile: 65, // Mock value
        averageInArea: latestCost * 0.87, // Mock: 13% below user
        yourCost: latestCost
      }
    };
  }
}

// Cloudflare D1 Database Implementation (för produktion)
type D1RunResult = { meta?: { changes?: number } };

class CloudflareDatabase implements Database {
  private db: CloudflareD1Database;

  constructor(db: CloudflareD1Database) {
    this.db = db;
  }

  async getProviders(customerType: "private" | "business" = "private"): Promise<ElectricityProvider[]> {
    const result = await this.db.prepare(`
      SELECT * FROM electricity_providers 
      WHERE is_active = 1 
        AND customer_type = ?
      ORDER BY energy_price ASC
    `).bind(customerType).all();

    const rows = Array.isArray(result.results) ? result.results : [];

    return rows.map((value) => {
      const row = value as Record<string, unknown>;
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
        customerType: (row.customer_type as "private" | "business") || "private",
        features: JSON.parse(String(row.features || "[]")) as string[],
        logoUrl: row.logo_url && String(row.logo_url).trim() ? String(row.logo_url).trim() : undefined,
        websiteUrl: row.website_url && String(row.website_url).trim() ? String(row.website_url).trim() : undefined,
        affiliateUrl: row.affiliate_url && String(row.affiliate_url).trim() ? String(row.affiliate_url).trim() : undefined,
        phoneNumber: row.phone_number && String(row.phone_number).trim() ? String(row.phone_number).trim() : undefined,
        avtalsalternativ: row.avtalsalternativ ? JSON.parse(String(row.avtalsalternativ)) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
      };
    });
  }

  async getAllProviders(): Promise<ElectricityProvider[]> {
    const result = await this.db.prepare(`
      SELECT * FROM electricity_providers 
      ORDER BY energy_price ASC
    `).all();

    const rows = Array.isArray(result.results) ? result.results : [];

    return rows.map((value) => {
      const row = value as Record<string, unknown>;
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
        customerType: (row.customer_type as "private" | "business") || "private",
        features: JSON.parse(String(row.features || "[]")) as string[],
        logoUrl: row.logo_url && String(row.logo_url).trim() ? String(row.logo_url).trim() : undefined,
        websiteUrl: row.website_url && String(row.website_url).trim() ? String(row.website_url).trim() : undefined,
        affiliateUrl: row.affiliate_url && String(row.affiliate_url).trim() ? String(row.affiliate_url).trim() : undefined,
        phoneNumber: row.phone_number && String(row.phone_number).trim() ? String(row.phone_number).trim() : undefined,
        avtalsalternativ: row.avtalsalternativ ? JSON.parse(String(row.avtalsalternativ)) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
      };
    });
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
      customerType: (row.customer_type as "private" | "business") || "private",
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
              contract_length, contract_type, is_active, user_hidden, customer_type, features, logo_url, website_url, 
              affiliate_url, phone_number, avtalsalternativ, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            providerData.customerType ?? "private",
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
      customerType: providerData.customerType ?? "private",
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
      if (providerData.customerType !== undefined) {
        fieldsToUpdate.push('customer_type = ?');
        values.push(providerData.customerType);
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

      const result = await this.db.prepare(sql).bind(...values).run() as { meta?: { changes?: number } };

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
    `).bind(id).run() as D1RunResult;

    return (result.meta?.changes || 0) > 0;
  }

  // Lead methods
  async getLeads(): Promise<Lead[]> {
    const result = await this.db.prepare(`
      SELECT * FROM leads 
      ORDER BY created_at DESC
    `).all();

    const rows = Array.isArray(result.results) ? result.results : [];

    return rows.map((value) => {
      const row = value as Record<string, unknown>;
      return {
        id: String(row.id),
        email: String(row.email || ""),
        phone: String(row.phone || ""),
        billData: JSON.parse(String(row.bill_data)),
        savings: JSON.parse(String(row.savings_data)),
        status: String(row.status) as Lead["status"],
        createdAt: new Date(String(row.created_at)),
      };
    });
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

    const result = await this.db.prepare(`
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
    ).run() as D1RunResult;

    if (result.meta?.changes === 0) {
      throw new Error(`No rows were updated for lead ${id}`);
    }

    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM leads WHERE id = ?
    `).bind(id).run() as D1RunResult;

    return (result.meta?.changes || 0) > 0;
  }

  // Switch Request methods
  async getSwitchRequests(): Promise<SwitchRequest[]> {
    const result = await this.db.prepare(`
      SELECT * FROM switch_requests 
      ORDER BY created_at DESC
    `).all();

    const rows = Array.isArray(result.results) ? result.results : [];

    return rows.map((value) => {
      const row = value as Record<string, unknown>;
      const customerInfo = JSON.parse(String(row.customer_info));
      const address = JSON.parse(String(row.address));
      const newProviderRaw = JSON.parse(String(row.new_provider));
      const priceSnapshot = (newProviderRaw as any)?._priceSnapshot;
      const newProvider = { ...newProviderRaw };
      delete (newProvider as any)._priceSnapshot;
      
      return {
        id: String(row.id),
        customerInfo: { ...customerInfo, address },
        currentProvider: JSON.parse(String(row.current_provider)),
        newProvider: newProvider,
        billData: JSON.parse(String(row.bill_data)),
        savings: JSON.parse(String(row.savings)),
        status: String(row.status) as SwitchRequest['status'],
        notes: row.notes ? String(row.notes) : undefined,
        priceSnapshot: priceSnapshot,
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
    const newProviderRaw = JSON.parse(String(row.new_provider));
    const priceSnapshot = (newProviderRaw as any)?._priceSnapshot;
    const newProvider = { ...newProviderRaw };
    delete (newProvider as any)._priceSnapshot;
    
    return {
      id: String(row.id),
      customerInfo: { ...customerInfo, address },
      currentProvider: JSON.parse(String(row.current_provider)),
      newProvider: newProvider,
      billData: JSON.parse(String(row.bill_data)),
      savings: JSON.parse(String(row.savings)),
      status: String(row.status) as SwitchRequest['status'],
      notes: row.notes ? String(row.notes) : undefined,
      priceSnapshot: priceSnapshot,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  async createSwitchRequest(switchRequestData: Omit<SwitchRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<SwitchRequest> {
    const id = `switch-${Date.now()}`;
    const now = new Date().toISOString();

    const { address, ...customerInfoWithoutAddress } = switchRequestData.customerInfo;
    // Inkludera priceSnapshot i new_provider JSON för enkel lagring
    const newProviderWithSnapshot = {
      ...switchRequestData.newProvider,
      ...(switchRequestData.priceSnapshot ? { _priceSnapshot: switchRequestData.priceSnapshot } : {})
    };
    
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
      JSON.stringify(newProviderWithSnapshot),
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
    // Inkludera priceSnapshot i new_provider JSON vid uppdatering också
    const newProviderWithSnapshot = {
      ...updated.newProvider,
      ...(updated.priceSnapshot ? { _priceSnapshot: updated.priceSnapshot } : {})
    };

    const result = await this.db.prepare(`
      UPDATE switch_requests SET
        customer_info = ?, address = ?, current_provider = ?, new_provider = ?,
        bill_data = ?, savings = ?, status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(customerInfoWithoutAddress),
      JSON.stringify(address),
      JSON.stringify(updated.currentProvider),
      JSON.stringify(newProviderWithSnapshot),
      JSON.stringify(updated.billData),
      JSON.stringify(updated.savings),
      safeStatus,
      updated.notes || null,
      now,
      id
    ).run() as D1RunResult;

    if (result.meta?.changes === 0) {
      throw new Error(`No rows were updated for switch request ${id}`);
    }

    return updated;
  }

  async deleteSwitchRequest(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM switch_requests WHERE id = ?
    `).bind(id).run() as D1RunResult;

    return (result.meta?.changes || 0) > 0;
  }

  // News Post methods
  async getNewsPosts(includeUnpublished: boolean = false): Promise<NewsPost[]> {
    try {
      const query = includeUnpublished
        ? `SELECT * FROM news_posts ORDER BY published_at DESC, created_at DESC`
        : `SELECT * FROM news_posts WHERE is_published = 1 ORDER BY published_at DESC, created_at DESC`;
      
      const result = await this.db.prepare(query).all();

      const rows = Array.isArray(result.results) ? result.results : [];

      return rows.map((value) => {
        const row = value as Record<string, unknown>;
        return {
          id: String(row.id),
          title: String(row.title),
          excerpt: row.excerpt ? String(row.excerpt) : undefined,
          content: String(row.content),
          imageUrl: row.image_url ? String(row.image_url) : undefined,
          externalLink: row.external_link ? String(row.external_link) : undefined,
          publishedAt: new Date(String(row.published_at || row.created_at)),
          createdAt: new Date(String(row.created_at)),
          updatedAt: new Date(String(row.updated_at)),
          isPublished: Boolean(row.is_published),
        };
      });
    } catch (error) {
      // Om tabellen inte finns ännu (t.ex. på remote), returnera tom array
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('news_posts')) {
        console.warn('[Database] news_posts table does not exist yet, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async getNewsPost(id: string): Promise<NewsPost | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM news_posts WHERE id = ?
      `).bind(id).first();

      if (!result) return null;

      const row = result as Record<string, unknown>;
      return {
        id: String(row.id),
        title: String(row.title),
        excerpt: row.excerpt ? String(row.excerpt) : undefined,
        content: String(row.content),
        imageUrl: row.image_url ? String(row.image_url) : undefined,
        externalLink: row.external_link ? String(row.external_link) : undefined,
        publishedAt: new Date(String(row.published_at || row.created_at)),
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
        isPublished: Boolean(row.is_published)
      };
    } catch (error) {
      // Om tabellen inte finns ännu, returnera null
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('news_posts')) {
        console.warn('[Database] news_posts table does not exist yet');
        return null;
      }
      throw error;
    }
  }

  async createNewsPost(newsPostData: Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsPost> {
    const id = `news-${Date.now()}`;
    const now = new Date().toISOString();
    const publishedAt = newsPostData.publishedAt ? newsPostData.publishedAt.toISOString() : now;

    try {
      await this.db.prepare(`
        INSERT INTO news_posts (
          id, title, excerpt, content, image_url, external_link, 
          published_at, is_published, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        newsPostData.title,
        newsPostData.excerpt || null,
        newsPostData.content,
        newsPostData.imageUrl || null,
        newsPostData.externalLink || null,
        publishedAt,
        newsPostData.isPublished ? 1 : 0,
        now,
        now
      ).run();

      return {
        ...newsPostData,
        id,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('news_posts')) {
        throw new Error('news_posts table does not exist. Please run the migration first.');
      }
      throw error;
    }
  }

  async updateNewsPost(id: string, newsPostData: Partial<NewsPost>): Promise<NewsPost> {
    const existing = await this.getNewsPost(id);
    if (!existing) {
      throw new Error(`News post with id ${id} not found`);
    }

    const updated = { ...existing, ...newsPostData, updatedAt: new Date() };
    const now = updated.updatedAt.toISOString();
    const publishedAt = updated.publishedAt ? updated.publishedAt.toISOString() : existing.publishedAt.toISOString();

    await this.db.prepare(`
      UPDATE news_posts SET
        title = ?, excerpt = ?, content = ?, image_url = ?, external_link = ?,
        published_at = ?, is_published = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      updated.title,
      updated.excerpt || null,
      updated.content,
      updated.imageUrl || null,
      updated.externalLink || null,
      publishedAt,
      updated.isPublished ? 1 : 0,
      now,
      id
    ).run();

    return updated;
  }

  async deleteNewsPost(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM news_posts WHERE id = ?
    `).bind(id).run() as D1RunResult;

    return (result.meta?.changes || 0) > 0;
  }

  // Chat Messages
  async getChatMessages(sessionId?: string, limit?: number, searchTerm?: string): Promise<ChatMessage[]> {
    try {
      let query = 'SELECT * FROM chat_messages';
      const bindings: unknown[] = [];
      const conditions: string[] = [];

      if (sessionId) {
        conditions.push('session_id = ?');
        bindings.push(sessionId);
      }

      if (searchTerm) {
        conditions.push('content LIKE ?');
        bindings.push(`%${searchTerm}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ' LIMIT ?';
        bindings.push(limit);
      }

      const result = await this.db.prepare(query).bind(...bindings).all();
      const rows = Array.isArray(result.results) ? result.results : [];

      return rows.map((value) => {
        const row = value as Record<string, unknown>;
        return {
          id: String(row.id),
          sessionId: String(row.session_id),
          role: String(row.role) as 'user' | 'assistant' | 'system',
          content: String(row.content),
          context: row.context ? JSON.parse(String(row.context)) : undefined,
          ipAddress: row.ip_address ? String(row.ip_address) : undefined,
          userAgent: row.user_agent ? String(row.user_agent) : undefined,
          model: row.model ? String(row.model) : undefined,
          responseTimeMs: row.response_time_ms ? Number(row.response_time_ms) : undefined,
          error: row.error ? String(row.error) : undefined,
          createdAt: new Date(String(row.created_at))
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('chat_messages')) {
        console.warn('[Database] chat_messages table does not exist. Please run the migration first.');
        return [];
      }
      throw error;
    }
  }

  async getChatMessage(id: string): Promise<ChatMessage | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM chat_messages WHERE id = ?
      `).bind(id).first();

      if (!result) {
        return null;
      }

      const row = result as Record<string, unknown>;
      return {
        id: String(row.id),
        sessionId: String(row.session_id),
        role: String(row.role) as 'user' | 'assistant' | 'system',
        content: String(row.content),
        context: row.context ? JSON.parse(String(row.context)) : undefined,
        ipAddress: row.ip_address ? String(row.ip_address) : undefined,
        userAgent: row.user_agent ? String(row.user_agent) : undefined,
        model: row.model ? String(row.model) : undefined,
        responseTimeMs: row.response_time_ms ? Number(row.response_time_ms) : undefined,
        error: row.error ? String(row.error) : undefined,
        createdAt: new Date(String(row.created_at))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('chat_messages')) {
        console.warn('[Database] chat_messages table does not exist. Please run the migration first.');
        return null;
      }
      throw error;
    }
  }

  async createChatMessage(messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    try {
      const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO chat_messages (
          id, session_id, role, content, context, ip_address, user_agent,
          model, response_time_ms, error, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        messageData.sessionId,
        messageData.role,
        messageData.content,
        messageData.context ? JSON.stringify(messageData.context) : null,
        messageData.ipAddress || null,
        messageData.userAgent || null,
        messageData.model || null,
        messageData.responseTimeMs || null,
        messageData.error || null,
        now
      ).run();

      return {
        ...messageData,
        id,
        createdAt: new Date(now)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('chat_messages')) {
        throw new Error('chat_messages table does not exist. Please run the migration first.');
      }
      throw error;
    }
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(`
        DELETE FROM chat_messages WHERE id = ?
      `).bind(id).run() as D1RunResult;

      return (result.meta?.changes || 0) > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('chat_messages')) {
        console.warn('[Database] chat_messages table does not exist.');
        return false;
      }
      throw error;
    }
  }

  // Postal Code Analytics methods
  async createPostalCodeAnalytics(analyticsData: Omit<PostalCodeAnalytics, 'id' | 'createdAt'>): Promise<PostalCodeAnalytics> {
    try {
      const id = `postal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO postal_code_analytics (
          id, postal_code, detected_area, selected_area, was_manually_changed,
          ip_address, user_agent, page_context, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        analyticsData.postalCode,
        analyticsData.detectedArea || null,
        analyticsData.selectedArea,
        analyticsData.wasManuallyChanged ? 1 : 0,
        analyticsData.ipAddress || null,
        analyticsData.userAgent || null,
        analyticsData.pageContext || null,
        now
      ).run();

      return {
        ...analyticsData,
        id,
        createdAt: new Date(now)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('postal_code_analytics')) {
        throw new Error('postal_code_analytics table does not exist. Please run the migration first.');
      }
      throw error;
    }
  }

  async getPostalCodeAnalytics(limit?: number): Promise<PostalCodeAnalytics[]> {
    try {
      let query = `
        SELECT * FROM postal_code_analytics
        ORDER BY created_at DESC
      `;
      
      if (limit) {
        query += ` LIMIT ?`;
      }

      const result = limit 
        ? await this.db.prepare(query).bind(limit).all()
        : await this.db.prepare(query).all();

      const rows = Array.isArray(result.results) ? result.results : [];

      return rows.map((value) => {
        const row = value as Record<string, unknown>;
        const createdAtStr = String(row.created_at || '');
        // Konvertera created_at från databas (ISO string) till Date-objekt
        const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
        
        return {
          id: String(row.id),
          postalCode: String(row.postal_code),
          detectedArea: row.detected_area ? String(row.detected_area) : undefined,
          selectedArea: String(row.selected_area),
          wasManuallyChanged: Boolean(row.was_manually_changed),
          ipAddress: row.ip_address ? String(row.ip_address) : undefined,
          userAgent: row.user_agent ? String(row.user_agent) : undefined,
          pageContext: row.page_context ? String(row.page_context) : undefined,
          createdAt: createdAt
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('postal_code_analytics')) {
        console.warn('[Database] postal_code_analytics table does not exist.');
        return [];
      }
      throw error;
    }
  }

  // Bill Analyses methods
  async getBillAnalyses(limit?: number, validationStatus?: BillAnalysis['validationStatus']): Promise<BillAnalysis[]> {
    try {
      let query = `
        SELECT * FROM bill_analyses
      `;
      
      const bindings: unknown[] = [];
      
      if (validationStatus) {
        query += ` WHERE validation_status = ?`;
        bindings.push(validationStatus);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      if (limit) {
        query += ` LIMIT ?`;
        bindings.push(limit);
      }

      const result = bindings.length > 0
        ? await this.db.prepare(query).bind(...bindings).all()
        : await this.db.prepare(query).all();

      const rows = Array.isArray(result.results) ? result.results : [];

      return rows.map((value) => {
        const row = value as Record<string, unknown>;
        return {
          id: String(row.id),
          billData: JSON.parse(String(row.bill_data)) as BillAnalysis['billData'],
          savings: JSON.parse(String(row.savings_data)) as BillAnalysis['savings'],
          imageKey: row.image_key ? String(row.image_key) : undefined,
          imageUrl: row.image_url ? String(row.image_url) : undefined,
          originalFileName: row.original_file_name ? String(row.original_file_name) : undefined,
          postalCode: row.postal_code ? String(row.postal_code) : undefined,
          priceArea: row.price_area ? String(row.price_area) : undefined,
          aiConfidence: row.ai_confidence ? Number(row.ai_confidence) : undefined,
          aiWarnings: row.ai_warnings ? JSON.parse(String(row.ai_warnings)) : undefined,
          validationStatus: (row.validation_status as BillAnalysis['validationStatus']) || 'pending',
          validationNotes: row.validation_notes ? String(row.validation_notes) : undefined,
          validatedBy: row.validated_by ? String(row.validated_by) : undefined,
          validatedAt: row.validated_at ? new Date(String(row.validated_at)) : undefined,
          ipAddress: row.ip_address ? String(row.ip_address) : undefined,
          userAgent: row.user_agent ? String(row.user_agent) : undefined,
          userId: row.user_id ? String(row.user_id) : undefined,
          createdAt: new Date(String(row.created_at))
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
        console.warn('[Database] bill_analyses table does not exist.');
        return [];
      }
      throw error;
    }
  }

  async getBillAnalysis(id: string): Promise<BillAnalysis | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM bill_analyses WHERE id = ?
      `).bind(id).first();

      if (!result) {
        return null;
      }

      const row = result as Record<string, unknown>;
      return {
        id: String(row.id),
        billData: JSON.parse(String(row.bill_data)) as BillAnalysis['billData'],
        savings: JSON.parse(String(row.savings_data)) as BillAnalysis['savings'],
        imageKey: row.image_key ? String(row.image_key) : undefined,
        imageUrl: row.image_url ? String(row.image_url) : undefined,
        originalFileName: row.original_file_name ? String(row.original_file_name) : undefined,
        postalCode: row.postal_code ? String(row.postal_code) : undefined,
        priceArea: row.price_area ? String(row.price_area) : undefined,
        aiConfidence: row.ai_confidence ? Number(row.ai_confidence) : undefined,
        aiWarnings: row.ai_warnings ? JSON.parse(String(row.ai_warnings)) : undefined,
        validationStatus: (row.validation_status as BillAnalysis['validationStatus']) || 'pending',
        validationNotes: row.validation_notes ? String(row.validation_notes) : undefined,
        validatedBy: row.validated_by ? String(row.validated_by) : undefined,
        validatedAt: row.validated_at ? new Date(String(row.validated_at)) : undefined,
          ipAddress: row.ip_address ? String(row.ip_address) : undefined,
          userAgent: row.user_agent ? String(row.user_agent) : undefined,
          userId: row.user_id ? String(row.user_id) : undefined,
          createdAt: new Date(String(row.created_at))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
        console.warn('[Database] bill_analyses table does not exist.');
        return null;
      }
      throw error;
    }
  }

  async createBillAnalysis(analysisData: Omit<BillAnalysis, 'id' | 'createdAt'>): Promise<BillAnalysis> {
    try {
      const id = `bill-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO bill_analyses (
          id, bill_data, savings_data, image_key, image_url, original_file_name,
          postal_code, price_area, ai_confidence, ai_warnings,
          validation_status, validation_notes, validated_by, validated_at,
          ip_address, user_agent, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        JSON.stringify(analysisData.billData),
        JSON.stringify(analysisData.savings),
        analysisData.imageKey || null,
        analysisData.imageUrl || null,
        analysisData.originalFileName || null,
        analysisData.postalCode || null,
        analysisData.priceArea || null,
        analysisData.aiConfidence || null,
        analysisData.aiWarnings ? JSON.stringify(analysisData.aiWarnings) : null,
        analysisData.validationStatus || 'pending',
        analysisData.validationNotes || null,
        analysisData.validatedBy || null,
        analysisData.validatedAt ? analysisData.validatedAt.toISOString() : null,
        analysisData.ipAddress || null,
        analysisData.userAgent || null,
        analysisData.userId || null,
        now
      ).run();

      return {
        ...analysisData,
        id,
        createdAt: new Date(now)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
        throw new Error('bill_analyses table does not exist. Please run the migration first.');
      }
      throw error;
    }
  }

  async updateBillAnalysis(id: string, analysisData: Partial<BillAnalysis>): Promise<BillAnalysis> {
    try {
      const existing = await this.getBillAnalysis(id);
      if (!existing) {
        throw new Error(`Bill analysis with id ${id} not found`);
      }

      const updates: string[] = [];
      const bindings: unknown[] = [];

      if (analysisData.billData !== undefined) {
        updates.push('bill_data = ?');
        bindings.push(JSON.stringify(analysisData.billData));
      }
      if (analysisData.savings !== undefined) {
        updates.push('savings_data = ?');
        bindings.push(JSON.stringify(analysisData.savings));
      }
      if (analysisData.validationStatus !== undefined) {
        updates.push('validation_status = ?');
        bindings.push(analysisData.validationStatus);
      }
      if (analysisData.validationNotes !== undefined) {
        updates.push('validation_notes = ?');
        bindings.push(analysisData.validationNotes || null);
      }
      if (analysisData.validatedBy !== undefined) {
        updates.push('validated_by = ?');
        bindings.push(analysisData.validatedBy || null);
      }
      if (analysisData.validatedAt !== undefined) {
        updates.push('validated_at = ?');
        bindings.push(analysisData.validatedAt ? analysisData.validatedAt.toISOString() : null);
      }

      if (updates.length === 0) {
        return existing;
      }

      bindings.push(id);

      await this.db.prepare(`
        UPDATE bill_analyses 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).bind(...bindings).run();

      return await this.getBillAnalysis(id) as BillAnalysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
        throw new Error('bill_analyses table does not exist. Please run the migration first.');
      }
      throw error;
    }
  }

  async deleteBillAnalysis(id: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(`
        DELETE FROM bill_analyses WHERE id = ?
      `).bind(id).run() as D1RunResult;

      return (result.meta?.changes || 0) > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('bill_analyses')) {
        console.warn('[Database] bill_analyses table does not exist.');
        return false;
      }
      throw error;
    }
  }

  async getBillAnalysesByUserId(userId: string, range: string = 'year'): Promise<BillAnalysis[]> {
    try {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (range) {
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          cutoffDate = new Date(0);
      }

      const result = await this.db.prepare(`
        SELECT * FROM bill_analyses
        WHERE user_id = ? AND created_at >= ?
        ORDER BY created_at DESC
      `).bind(userId, cutoffDate.toISOString()).all();

      const rows = Array.isArray(result.results) ? result.results : [];
      return rows.map((value) => {
        const row = value as Record<string, unknown>;
        return {
          id: String(row.id),
          billData: JSON.parse(String(row.bill_data)) as BillAnalysis['billData'],
          savings: JSON.parse(String(row.savings_data)) as BillAnalysis['savings'],
          imageKey: row.image_key ? String(row.image_key) : undefined,
          imageUrl: row.image_url ? String(row.image_url) : undefined,
          originalFileName: row.original_file_name ? String(row.original_file_name) : undefined,
          postalCode: row.postal_code ? String(row.postal_code) : undefined,
          priceArea: row.price_area ? String(row.price_area) : undefined,
          aiConfidence: row.ai_confidence ? Number(row.ai_confidence) : undefined,
          aiWarnings: row.ai_warnings ? JSON.parse(String(row.ai_warnings)) : undefined,
          validationStatus: (row.validation_status as BillAnalysis['validationStatus']) || 'pending',
          validationNotes: row.validation_notes ? String(row.validation_notes) : undefined,
          validatedBy: row.validated_by ? String(row.validated_by) : undefined,
          validatedAt: row.validated_at ? new Date(String(row.validated_at)) : undefined,
          ipAddress: row.ip_address ? String(row.ip_address) : undefined,
          userAgent: row.user_agent ? String(row.user_agent) : undefined,
          userId: row.user_id ? String(row.user_id) : undefined,
          createdAt: new Date(String(row.created_at))
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table')) {
        return [];
      }
      throw error;
    }
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(email).first();

      if (!result) return null;

      const row = result as Record<string, unknown>;
      return {
        id: String(row.id),
        email: String(row.email),
        name: row.name ? String(row.name) : undefined,
        image: row.image ? String(row.image) : undefined,
        googleId: row.google_id ? String(row.google_id) : undefined,
        subscriptionTier: row.subscription_tier ? String(row.subscription_tier) as 'free' | 'premium' : 'free',
        subscriptionStatus: row.subscription_status ? String(row.subscription_status) as 'active' | 'cancelled' | 'expired' : undefined,
        subscriptionStartedAt: row.subscription_started_at ? new Date(String(row.subscription_started_at)) : undefined,
        subscriptionExpiresAt: row.subscription_expires_at ? new Date(String(row.subscription_expires_at)) : undefined,
        subscriptionStripeId: row.subscription_stripe_id ? String(row.subscription_stripe_id) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table')) {
        return null;
      }
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).bind(id).first();

      if (!result) return null;

      const row = result as Record<string, unknown>;
      return {
        id: String(row.id),
        email: String(row.email),
        name: row.name ? String(row.name) : undefined,
        image: row.image ? String(row.image) : undefined,
        googleId: row.google_id ? String(row.google_id) : undefined,
        subscriptionTier: row.subscription_tier ? String(row.subscription_tier) as 'free' | 'premium' : 'free',
        subscriptionStatus: row.subscription_status ? String(row.subscription_status) as 'active' | 'cancelled' | 'expired' : undefined,
        subscriptionStartedAt: row.subscription_started_at ? new Date(String(row.subscription_started_at)) : undefined,
        subscriptionExpiresAt: row.subscription_expires_at ? new Date(String(row.subscription_expires_at)) : undefined,
        subscriptionStripeId: row.subscription_stripe_id ? String(row.subscription_stripe_id) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table')) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateUser(userData: { email: string; name?: string; image?: string; googleId?: string }): Promise<User> {
    try {
      const now = new Date().toISOString();
      
      // Try to get existing user
      const existing = await this.getUserByEmail(userData.email);
      
      if (existing) {
        // Update existing user
        await this.db.prepare(`
          UPDATE users 
          SET name = ?, image = ?, google_id = ?, updated_at = ?
          WHERE email = ?
        `).bind(
          userData.name || existing.name || null,
          userData.image || existing.image || null,
          userData.googleId || existing.googleId || null,
          now,
          userData.email
        ).run();

        return await this.getUserByEmail(userData.email) as User;
      } else {
        // Create new user
        const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await this.db.prepare(`
          INSERT INTO users (id, email, name, image, google_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          userData.email,
          userData.name || null,
          userData.image || null,
          userData.googleId || null,
          now,
          now
        ).run();

        return await this.getUserById(id) as User;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table')) {
        throw new Error('users table does not exist. Please run migration 0034_create_users_table.sql');
      }
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const analyses = await this.getBillAnalysesByUserId(userId, 'all');
      
      if (analyses.length === 0) {
        return {
          totalAnalyses: 0,
          totalSavings: 0,
          averageSavings: 0,
          currentMonthlyCost: 0,
          lastAnalysisDate: null,
          trend: 'stable',
          benchmarkComparison: {
            percentile: 50,
            averageInArea: 0,
            yourCost: 0
          }
        };
      }

      const totalSavings = analyses.reduce((sum, a) => sum + a.savings.potentialSavings, 0);
      const avgSavings = totalSavings / analyses.length;
      const latestCost = analyses[0]?.billData.totalAmount || 0;
      const lastDate = analyses[0]?.createdAt.toISOString() || null;

      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (analyses.length >= 2) {
        const recent = analyses[0].billData.totalAmount;
        const previous = analyses[1].billData.totalAmount;
        if (recent > previous * 1.05) trend = 'up';
        else if (recent < previous * 0.95) trend = 'down';
      }

      // Calculate benchmark (simplified - in production, query aggregated data)
      const priceArea = analyses[0]?.billData.priceArea;
      const avgInArea = latestCost * 0.87; // Mock calculation
      const percentile = latestCost > avgInArea ? 65 : 35;

      return {
        totalAnalyses: analyses.length,
        totalSavings,
        averageSavings: avgSavings,
        currentMonthlyCost: latestCost,
        lastAnalysisDate: lastDate,
        trend,
        benchmarkComparison: {
          percentile,
          averageInArea: avgInArea,
          yourCost: latestCost
        }
      };
    } catch (error) {
      console.error('[Database] Error getting user stats:', error);
      throw error;
    }
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
    return new CloudflareDatabase((process.env as unknown as Record<string, unknown>).DB as unknown as CloudflareD1Database);
  }

  throw new Error('[Database] No D1 database available - D1 database is required for production');
}

// Factory för Cloudflare Pages/Workers där DB finns i request context
export function createDatabaseFromBinding(binding: unknown): Database {
  if (binding) {
    console.log('[Database] Using CloudflareDatabase with D1 binding');
    return new CloudflareDatabase(binding as CloudflareD1Database);
  }
  // Fallback till mock database i utveckling
  console.log('[Database] No D1 binding, using MockDatabase in development');
  return MockDatabase.getInstance();
}

// Exportera inte en global singleton för att undvika felaktig miljö i Edge-runtime
// Konsumenter bör anropa createDatabaseFromBinding(...) per request
