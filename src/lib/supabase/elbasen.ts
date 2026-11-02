import type { ElectricityProvider, BillAnalysis } from "@/lib/types";
import { ELBESPAREN_SOURCE, getSupabaseAdmin } from "@/lib/supabase/admin";

type ProviderRow = {
  id: string;
  name: string;
  description: string;
  monthly_fee: number;
  energy_price: number;
  free_months: number;
  contract_length: number;
  contract_type: string;
  is_active: boolean;
  user_hidden: boolean;
  customer_type: string;
  features: unknown;
  logo_url: string | null;
  website_url: string | null;
  affiliate_url: string | null;
  phone_number: string | null;
  avtalsalternativ: unknown;
  created_at: string;
  updated_at: string;
};

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function mapProviderRow(row: ProviderRow): ElectricityProvider {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description || ""),
    monthlyFee: Number(row.monthly_fee) || 0,
    energyPrice: Number(row.energy_price) || 0,
    freeMonths: Number(row.free_months) || 0,
    contractLength: Number(row.contract_length) || 0,
    contractType: (row.contract_type as "rörligt" | "fastpris") || "rörligt",
    isActive: Boolean(row.is_active),
    userHidden: Boolean(row.user_hidden),
    customerType: (row.customer_type as "private" | "business") || "private",
    features: parseJsonField<string[]>(row.features, []),
    logoUrl: row.logo_url?.trim() || undefined,
    websiteUrl: row.website_url?.trim() || undefined,
    affiliateUrl: row.affiliate_url?.trim() || undefined,
    phoneNumber: row.phone_number?.trim() || undefined,
    avtalsalternativ: parseJsonField(row.avtalsalternativ, undefined),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function providerToRow(
  id: string,
  provider: Omit<ElectricityProvider, "id" | "createdAt" | "updatedAt"> & {
    createdAt?: Date;
    updatedAt?: Date;
  },
  nowIso: string
) {
  return {
    id,
    name: provider.name,
    description: provider.description || "",
    monthly_fee: provider.monthlyFee,
    energy_price: provider.energyPrice,
    free_months: provider.freeMonths,
    contract_length: provider.contractLength,
    contract_type: provider.contractType,
    is_active: provider.isActive !== false,
    user_hidden: Boolean(provider.userHidden),
    customer_type: provider.customerType ?? "private",
    features: provider.features || [],
    logo_url: provider.logoUrl || null,
    website_url: provider.websiteUrl || null,
    affiliate_url: provider.affiliateUrl || null,
    phone_number: provider.phoneNumber || null,
    avtalsalternativ: provider.avtalsalternativ || null,
    source: ELBESPAREN_SOURCE,
    created_at: provider.createdAt?.toISOString?.() || nowIso,
    updated_at: provider.updatedAt?.toISOString?.() || nowIso,
  };
}

export async function supabaseGetProviders(
  customerType: "private" | "business" = "private"
): Promise<ElectricityProvider[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("electricity_providers")
    .select("*")
    .eq("source", ELBESPAREN_SOURCE)
    .eq("is_active", true)
    .eq("customer_type", customerType)
    .order("energy_price", { ascending: true });

  if (error) {
    console.error("[elbasen] getProviders:", error.message);
    return null;
  }
  return (data as ProviderRow[]).map(mapProviderRow);
}

export async function supabaseGetAllProviders(): Promise<ElectricityProvider[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("electricity_providers")
    .select("*")
    .eq("source", ELBESPAREN_SOURCE)
    .order("energy_price", { ascending: true });

  if (error) {
    console.error("[elbasen] getAllProviders:", error.message);
    return null;
  }
  return (data as ProviderRow[]).map(mapProviderRow);
}

export async function supabaseGetProvider(id: string): Promise<ElectricityProvider | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("electricity_providers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[elbasen] getProvider:", error.message);
    return null;
  }
  return data ? mapProviderRow(data as ProviderRow) : null;
}

export async function supabaseUpsertProvider(
  id: string,
  provider: Omit<ElectricityProvider, "id" | "createdAt" | "updatedAt"> & {
    createdAt?: Date;
    updatedAt?: Date;
  },
  nowIso: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const row = providerToRow(id, provider, nowIso);
  const { error } = await supabase.from("electricity_providers").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[elbasen] upsertProvider:", error.message);
    return false;
  }
  return true;
}

export async function supabasePatchProvider(
  id: string,
  patch: Partial<ElectricityProvider>,
  nowIso: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const updates: Record<string, unknown> = { updated_at: nowIso, source: ELBESPAREN_SOURCE };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.monthlyFee !== undefined) updates.monthly_fee = patch.monthlyFee;
  if (patch.energyPrice !== undefined) updates.energy_price = patch.energyPrice;
  if (patch.freeMonths !== undefined) updates.free_months = patch.freeMonths;
  if (patch.contractLength !== undefined) updates.contract_length = patch.contractLength;
  if (patch.contractType !== undefined) updates.contract_type = patch.contractType;
  if (patch.isActive !== undefined) updates.is_active = patch.isActive;
  if (patch.userHidden !== undefined) updates.user_hidden = patch.userHidden;
  if (patch.customerType !== undefined) updates.customer_type = patch.customerType;
  if (patch.features !== undefined) updates.features = patch.features;
  if (patch.logoUrl !== undefined) updates.logo_url = patch.logoUrl || null;
  if (patch.websiteUrl !== undefined) updates.website_url = patch.websiteUrl || null;
  if (patch.affiliateUrl !== undefined) updates.affiliate_url = patch.affiliateUrl || null;
  if (patch.phoneNumber !== undefined) updates.phone_number = patch.phoneNumber || null;
  if (patch.avtalsalternativ !== undefined) updates.avtalsalternativ = patch.avtalsalternativ || null;

  const { error } = await supabase.from("electricity_providers").update(updates).eq("id", id);
  if (error) {
    console.error("[elbasen] patchProvider:", error.message);
    return false;
  }
  return true;
}

export async function supabaseDeleteProvider(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("electricity_providers").delete().eq("id", id);
  if (error) {
    console.error("[elbasen] deleteProvider:", error.message);
    return false;
  }
  return true;
}

type AnalysisRow = {
  id: string;
  bill_data: string;
  savings_data: string;
  image_key: string | null;
  image_url: string | null;
  original_file_name: string | null;
  postal_code: string | null;
  price_area: string | null;
  ai_confidence: number | null;
  ai_warnings: string | null;
  validation_status: string | null;
  validation_notes: string | null;
  validated_by: string | null;
  validated_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string | null;
  created_at: string;
};

function mapAnalysisRow(row: AnalysisRow): BillAnalysis {
  return {
    id: String(row.id),
    billData: parseJsonField(row.bill_data, {} as BillAnalysis["billData"]),
    savings: parseJsonField(row.savings_data, {} as BillAnalysis["savings"]),
    imageKey: row.image_key || undefined,
    imageUrl: row.image_url || undefined,
    originalFileName: row.original_file_name || undefined,
    postalCode: row.postal_code || undefined,
    priceArea: row.price_area || undefined,
    aiConfidence: row.ai_confidence != null ? Number(row.ai_confidence) : undefined,
    aiWarnings: row.ai_warnings ? parseJsonField(row.ai_warnings, undefined) : undefined,
    validationStatus: (row.validation_status as BillAnalysis["validationStatus"]) || "pending",
    validationNotes: row.validation_notes || undefined,
    validatedBy: row.validated_by || undefined,
    validatedAt: row.validated_at ? new Date(row.validated_at) : undefined,
    ipAddress: row.ip_address || undefined,
    userAgent: row.user_agent || undefined,
    userId: row.user_id || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function supabaseCreateBillAnalysis(
  id: string,
  analysisData: Omit<BillAnalysis, "id" | "createdAt">,
  nowIso: string
): Promise<BillAnalysis | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const row = {
    id,
    bill_data: JSON.stringify(analysisData.billData),
    savings_data: JSON.stringify(analysisData.savings),
    image_key: analysisData.imageKey || null,
    image_url: analysisData.imageUrl || null,
    original_file_name: analysisData.originalFileName || null,
    postal_code: analysisData.postalCode || null,
    price_area: analysisData.priceArea || null,
    ai_confidence: analysisData.aiConfidence ?? null,
    ai_warnings: analysisData.aiWarnings ? JSON.stringify(analysisData.aiWarnings) : null,
    validation_status: analysisData.validationStatus || "pending",
    validation_notes: analysisData.validationNotes || null,
    validated_by: analysisData.validatedBy || null,
    validated_at: analysisData.validatedAt ? analysisData.validatedAt.toISOString() : null,
    ip_address: analysisData.ipAddress || null,
    user_agent: analysisData.userAgent || null,
    user_id: analysisData.userId || null,
    source: ELBESPAREN_SOURCE,
    created_at: nowIso,
  };

  const { error } = await supabase.from("bill_analyses").insert(row);
  if (error) {
    console.error("[elbasen] createBillAnalysis:", error.message);
    return null;
  }

  return { ...analysisData, id, createdAt: new Date(nowIso) };
}

export async function supabaseGetBillAnalyses(
  limit?: number,
  validationStatus?: BillAnalysis["validationStatus"]
): Promise<BillAnalysis[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  let query = supabase
    .from("bill_analyses")
    .select("*")
    .eq("source", ELBESPAREN_SOURCE)
    .order("created_at", { ascending: false });

  if (validationStatus) query = query.eq("validation_status", validationStatus);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("[elbasen] getBillAnalyses:", error.message);
    return null;
  }
  return (data as AnalysisRow[]).map(mapAnalysisRow);
}

export async function supabaseGetBillAnalysis(id: string): Promise<BillAnalysis | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.from("bill_analyses").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[elbasen] getBillAnalysis:", error.message);
    return null;
  }
  return data ? mapAnalysisRow(data as AnalysisRow) : null;
}

export async function supabaseCountBillAnalysesSince(since: Date): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from("bill_analyses")
    .select("*", { count: "exact", head: true })
    .eq("source", ELBESPAREN_SOURCE)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error("[elbasen] countBillAnalysesSince:", error.message);
    return null;
  }
  return count ?? 0;
}

export async function supabaseUpdateBillAnalysis(
  id: string,
  analysisData: Partial<BillAnalysis>
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const updates: Record<string, unknown> = {};
  if (analysisData.billData !== undefined) updates.bill_data = JSON.stringify(analysisData.billData);
  if (analysisData.savings !== undefined) updates.savings_data = JSON.stringify(analysisData.savings);
  if (analysisData.validationStatus !== undefined) updates.validation_status = analysisData.validationStatus;
  if (analysisData.validationNotes !== undefined) updates.validation_notes = analysisData.validationNotes || null;
  if (analysisData.validatedBy !== undefined) updates.validated_by = analysisData.validatedBy || null;
  if (analysisData.validatedAt !== undefined) {
    updates.validated_at = analysisData.validatedAt ? analysisData.validatedAt.toISOString() : null;
  }

  if (Object.keys(updates).length === 0) return true;

  const { error } = await supabase.from("bill_analyses").update(updates).eq("id", id);
  if (error) {
    console.error("[elbasen] updateBillAnalysis:", error.message);
    return false;
  }
  return true;
}

export async function supabaseDeleteBillAnalysis(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("bill_analyses").delete().eq("id", id);
  if (error) {
    console.error("[elbasen] deleteBillAnalysis:", error.message);
    return false;
  }
  return true;
}

export async function supabaseGetBillAnalysesByUserId(
  userId: string,
  cutoffIso: string
): Promise<BillAnalysis[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bill_analyses")
    .select("*")
    .eq("source", ELBESPAREN_SOURCE)
    .eq("user_id", userId)
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[elbasen] getBillAnalysesByUserId:", error.message);
    return null;
  }
  return (data as AnalysisRow[]).map(mapAnalysisRow);
}
