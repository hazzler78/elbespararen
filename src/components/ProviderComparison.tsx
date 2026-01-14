"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Star, Phone, Zap, ChevronDown } from "lucide-react";
import type { ProviderComparison, BillData, SavingsCalculation, SwitchRequest, ApiResponse, ContractAlternative } from "@/lib/types";
import { formatCurrency, formatPricePerKwh } from "@/lib/calculations";
import { resolveProviderLogo, createProviderLogoErrorHandler } from "@/lib/logo-utils";
import SwitchProcess from "./SwitchProcess";
import { trackCustomEvent } from "@/lib/analytics";

interface ProviderComparisonProps {
  billData: BillData;
  savings?: SavingsCalculation;
  hideSavings?: boolean; // Hide savings field for contracts page
  enableConsumptionEntry?: boolean; // On contracts page: ask for kWh and hide prices until provided
  onRequestContact?: () => void;
  secondaryCta?: {
    label: string;
    href: string;
  };
}

interface ComparisonData {
  currentCost: number;
  comparisons: ProviderComparison[];
  totalProviders: number;
  recommendedProviders: number;
}

export default function ProviderComparison({
  billData,
  savings,
  hideSavings = false,
  enableConsumptionEntry = false,
  onRequestContact,
  secondaryCta
}: ProviderComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSwitchProcess, setShowSwitchProcess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderComparison | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<Record<string, number>>({}); // providerId -> selectedContractIndex
  const [enteredKwh, setEnteredKwh] = useState<number | null>(enableConsumptionEntry ? null : billData.totalKWh);
  const [spotPrices, setSpotPrices] = useState<{ [key: string]: number } | null>(null);
  const [lookupSurcharges, setLookupSurcharges] = useState<Record<string, number>>({}); // providerId -> surcharge (kr/kWh, incl VAT)

  const getTags = (provider: any): string[] => {
    const tags: string[] = [];
    if (Array.isArray(provider.features)) {
      tags.push(...provider.features.filter((f: unknown) => typeof f === 'string') as string[]);
    }
    if (provider.contractType === "rörligt" && !tags.includes("Rörligt")) {
      tags.unshift("Rörligt");
    }
    if (typeof provider.freeMonths === 'number' && provider.freeMonths > 0 && !tags.includes("Kampanj")) {
      tags.push("Kampanj");
    }
    return tags;
  };

  const getAreaOptions = (provider: any): ContractAlternative[] => {
    const area = billData.priceArea;
    const all = Array.isArray(provider.avtalsalternativ) ? provider.avtalsalternativ : [];
    const hasAreaCodes = all.some((a: any) => !!a?.areaCode);
    if (!hasAreaCodes) return all;
    if (!area) return [];
    return all.filter((a: ContractAlternative) => a.areaCode === area);
  };

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        setIsLoading(true);
        console.log('[ProviderComparison] Sending billData:', billData);
        // Lägg till timestamp för att förhindra caching
        const response = await fetch(`/api/providers/compare?t=${Date.now()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({ billData }),
          cache: "no-store",
        });

        const result = await response.json() as ApiResponse<ComparisonData>;
        console.log('[ProviderComparison] API response:', result);

        if (result.success && result.data) {
          setComparisonData(result.data);
        } else {
          setError(result.error || "Kunde inte hämta jämförelser");
        }
      } catch (err) {
        setError("Nätverksfel vid hämtning av jämförelser");
        console.error("Provider comparison error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [billData]);

  // Load latest spot prices once for contracts use-case
  useEffect(() => {
    if (!enableConsumptionEntry) return;
    (async () => {
      try {
        const res = await fetch('/api/spot-prices');
        const json = (await res.json()) as { success?: boolean; data?: Record<string, number> };
        if (json && json.success && json.data) {
          setSpotPrices(json.data as { [key: string]: number });
        }
      } catch (e) {
        console.warn('Failed to load spot prices', e);
      }
    })();
  }, [enableConsumptionEntry]);

  // Fetch provider-specific surcharge (incl. VAT) for rörligt based on area and kWh band
  useEffect(() => {
    if (!comparisonData) return;
    if (!billData.priceArea) return;
    // Always fetch a surcharge band even if user hasn't entered consumption yet
    const providedKwh = Number(enableConsumptionEntry ? (enteredKwh ?? 0) : billData.totalKWh);
    const kwh = Number.isFinite(providedKwh) && providedKwh > 0 ? providedKwh : 2000; // default band

    const variableComparisons = comparisonData.comparisons.filter(c => c.provider.contractType === 'rörligt');
    if (variableComparisons.length === 0) return;

    let isCancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          variableComparisons.map(async (c) => {
            try {
              const res = await fetch('/api/prices/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerName: c.provider.name, area: billData.priceArea, kwh })
              });
              const json = (await res.json()) as ApiResponse<any>;
              const data = (json && (json as any).data) ? (json as any).data : {};
              const parse = (value: any) => {
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                  const normalized = value.replace(',', '.');
                  const parsed = Number(normalized);
                  return Number.isFinite(parsed) ? parsed : 0;
                }
                return 0;
              };
              const surcharge = parse((data as any).surcharge);
              const cert = parse((data as any).el_certificate_fee ?? (data as any).elCertificateFee);
              const discount = parse((data as any)._12_month_discount ?? (data as any)['12_month_discount']);
              
              // Debug: logga värden för att felsöka (särskilt för Cheap Energy)
              const isCheapEnergy = c.provider.name.toLowerCase().includes('cheap');
              if (isCheapEnergy || process.env.NODE_ENV === 'development') {
                const debugInfo = (json as any).debug;
                console.log(`[ProviderComparison] Lookup for ${c.provider.name} (${kwh} kWh):`, {
                  surcharge,
                  cert,
                  discount,
                  range: (data as any).range,
                  total_with_vat: (data as any).total_with_vat,
                  ...(debugInfo ? { debug: debugInfo } : {})
                });
              }
              
              // Values are in öre/kWh; convert to kr/kWh and include VAT (25%)
              // Discount kan vara negativ (rabatt), så summan kan bli negativ
              const surchargeOre = (Number.isFinite(surcharge) ? surcharge : 0) + 
                                   (Number.isFinite(cert) ? cert : 0) + 
                                   (Number.isFinite(discount) ? discount : 0);
              
              if (!Number.isFinite(surchargeOre)) {
                console.warn(`[ProviderComparison] Invalid surcharge calculation for ${c.provider.name}:`, { surcharge, cert, discount });
                return [c.provider.id, undefined] as const;
              }
              
              // Konvertera från öre till kr och lägg till moms (25%)
              // Negativa värden (rabatter) hanteras korrekt här
              const surchargeKrInclVat = (surchargeOre / 100) * 1.25;
              
              if (isCheapEnergy) {
                console.log(`[ProviderComparison] Cheap Energy calculated surcharge: ${surchargeOre} öre/kWh = ${surchargeKrInclVat} kr/kWh (inkl. moms)`);
              }
              
              return [c.provider.id, surchargeKrInclVat] as const;
            } catch {
              return [c.provider.id, undefined] as const;
            }
          })
        );
        if (isCancelled) return;
        const map: Record<string, number> = {};
        for (const [pid, val] of results) {
          if (typeof val === 'number' && isFinite(val)) map[pid] = val;
        }
        setLookupSurcharges(prev => ({ ...prev, ...map }));
      } catch {
        // ignore
      }
    })();

    return () => { isCancelled = true; };
  }, [comparisonData, billData.priceArea, enableConsumptionEntry, enteredKwh, billData.totalKWh]);

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-lg border border-border p-6"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted">Jämför leverantörer...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-white rounded-lg border border-border p-6"
      >
        <div className="text-center py-8">
          <p className="text-error mb-2">Kunde inte ladda jämförelser</p>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!comparisonData || comparisonData.comparisons.length === 0) {
    return (
      <div
        className="bg-white rounded-lg border border-border p-6"
      >
        <div className="text-center py-8">
          <p className="text-muted">Inga leverantörer tillgängliga för jämförelse</p>
        </div>
      </div>
    );
  }

  const { comparisons, currentCost } = comparisonData;
  const filteredComparisons = comparisons.filter((c) => {
    if (c.provider.contractType !== "fastpris") return true;
    const all = Array.isArray((c.provider as any).avtalsalternativ) ? (c.provider as any).avtalsalternativ : [];
    const hasAreaCodes = all.some((a: any) => !!a?.areaCode);
    const options = getAreaOptions(c.provider);
    return hasAreaCodes ? options.length > 0 : true;
  });
  const bestOption = filteredComparisons[0];
  const remainingComparisons = filteredComparisons.slice(bestOption ? 1 : 0);
  const bestOptionAreaOptions = bestOption ? getAreaOptions(bestOption.provider) : [];
  const bestOptionHasMultipleAreaOptions =
    !!bestOption && bestOption.provider.contractType === "fastpris" && bestOptionAreaOptions.length > 1;
  const variableComparisons = remainingComparisons.filter((comparison) => comparison.provider.contractType === "rörligt");
  const fixedComparisons = remainingComparisons.filter((comparison) => comparison.provider.contractType !== "rörligt");

  const handleSwitchClick = (comparison: ProviderComparison) => {
    // Track contract click event
    trackCustomEvent('contract_click', {
      provider_name: comparison.provider.name,
      provider_id: comparison.provider.id,
      contract_type: comparison.provider.contractType,
      estimated_savings: comparison.estimatedSavings,
      has_affiliate: !!(comparison.provider as any).affiliateUrl,
      page_context: enableConsumptionEntry ? 'contracts' : 'result'
    });

    const affiliate = (comparison.provider as any).affiliateUrl as string | undefined;
    if (affiliate && /^https?:\/\//i.test(affiliate)) {
      window.open(affiliate, '_blank', 'noopener');
      return;
    }
    setSelectedProvider(comparison);
    setShowSwitchProcess(true);
  };

  const handleSwitchComplete = (switchRequest: SwitchRequest) => {
    console.log("Switch request completed:", switchRequest);
    // Stäng SwitchProcess när användaren stängt bekräftelsedialogen
    setShowSwitchProcess(false);
  };

  const handleContractChange = (providerId: string, contractIndex: number) => {
    setSelectedContracts(prev => ({
      ...prev,
      [providerId]: contractIndex
    }));
  };

  const getSelectedContract = (provider: any): ContractAlternative | null => {
    if (!provider.avtalsalternativ || provider.avtalsalternativ.length === 0) {
      return null;
    }
    // Filtrera avtalsalternativ efter kundens prisområde om tillgängligt
    const area = billData.priceArea;
    const options: ContractAlternative[] = Array.isArray(provider.avtalsalternativ)
      ? (area ? provider.avtalsalternativ.filter((a: ContractAlternative) => !a.areaCode || a.areaCode === area) : provider.avtalsalternativ)
      : [];

    if (options.length === 0) {
      return provider.avtalsalternativ[0];
    }

    const selectedIndex = selectedContracts[provider.id] || 0;
    return options[selectedIndex] || options[0];
  };

  const effectiveKwh = enableConsumptionEntry ? (enteredKwh ?? 0) : billData.totalKWh;
  const showPrices = !enableConsumptionEntry || (enteredKwh !== null && enteredKwh > 0);

  const renderComparisonCard = (comparison: ProviderComparison) => {
    const areaOptions = getAreaOptions(comparison.provider);
    const hasMultipleAreaOptions = comparison.provider.contractType === "fastpris" && areaOptions.length > 1;
    const selectedContract = getSelectedContract(comparison.provider);
    const monthlyFee = selectedContract?.månadskostnad || comparison.provider.monthlyFee;
    const priceValue = selectedContract?.fastpris || lookupSurcharges[comparison.provider.id] || comparison.provider.energyPrice;
    const calculatedCost = formatCurrency(calculateProviderCost(comparison, selectedContract));
    const showSavings = !hideSavings && comparison.provider.contractType === "rörligt";

    return (
      <div
        key={comparison.provider.id}
        className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img
                src={resolveProviderLogo(comparison.provider.name, comparison.provider.logoUrl)}
                alt={`${comparison.provider.name} logo`}
                onError={createProviderLogoErrorHandler(comparison.provider.name)}
                className="h-12 w-auto object-contain max-w-[120px]"
                style={{
                  imageRendering: 'crisp-edges',
                  WebkitImageRendering: 'crisp-edges'
                } as React.CSSProperties}
                loading="lazy"
              />
              <h3 className="font-bold text-lg">{comparison.provider.name}</h3>
            </div>
            <p className="text-sm text-muted">{comparison.provider.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {getTags(comparison.provider).map((feature, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 bg-gray-50 px-2.5 py-0.5 rounded-full text-xs border border-border/60"
                >
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  {feature}
                </span>
              ))}
            </div>
          </div>
          {comparison.isRecommended && comparison.estimatedSavings > 0 && (
            <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs">
              <Zap className="w-3 h-3" />
              Rekommenderad
            </div>
          )}
        </div>

        {hasMultipleAreaOptions && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Välj avtalslängd
            </label>
            <div className="relative">
              <select
                value={selectedContracts[comparison.provider.id] || 0}
                onChange={(e) => handleContractChange(comparison.provider.id, parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white pr-8 text-sm"
              >
                {areaOptions.map((contract, contractIndex) => (
                  <option key={contractIndex} value={contractIndex}>
                    {contract.namn} - {formatPricePerKwh(contract.fastpris || 0)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted">Månadskostnad</p>
            <p className="font-semibold">
              {monthlyFee === 0 ? "0 kr" : `${monthlyFee} kr`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">
              {comparison.provider.contractType === "rörligt" ? "Påslag" : "Fastpris"}
            </p>
            <p className="font-semibold">
              {formatPricePerKwh(priceValue)}
            </p>
          </div>
        </div>

        {comparison.provider.contractType === "rörligt" && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted">Beräknad kostnad</p>
              <p className="font-bold text-lg">
                {showPrices ? calculatedCost : '—'}
              </p>
            </div>
            {showSavings && (
              <div className="text-right">
                <p className="text-sm text-muted">Besparing</p>
                <p className={`font-bold ${comparison.estimatedSavings > 0 ? 'text-success' : 'text-error'}`}>
                  {comparison.estimatedSavings > 0 ? '+' : ''}{formatCurrency(comparison.estimatedSavings)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleSwitchClick(comparison)}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Välj
          </button>
          {comparison.provider.phoneNumber && (
            <a
              href={`tel:${comparison.provider.phoneNumber}`}
              className="flex items-center justify-center gap-1 text-primary border border-primary py-2 px-3 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  };

  const calculateProviderCost = (comparison: ProviderComparison, selectedContract?: ContractAlternative | null) => {
    // Rörligt
    if (comparison.provider.contractType === "rörligt") {
      // På contracts-sidan: använd spotpris + påslag när spotpriser finns
      if (enableConsumptionEntry && spotPrices) {
        const area = billData.priceArea?.toLowerCase();
        const spot = area ? (spotPrices[area] || 0) : 0; // kr/kWh
        if (spot > 0) {
          const surcharge = lookupSurcharges[comparison.provider.id] ?? (comparison.provider.energyPrice || 0); // kr/kWh incl VAT
          const monthlyFee = comparison.provider.monthlyFee || 0;
          const kwh = Math.max(0, effectiveKwh);
          const energyCost = (spot + surcharge) * kwh;
          return monthlyFee + energyCost;
        }
      }
      // På result-sidan eller om spot saknas: använd serverns beräknade värde
      return comparison.estimatedMonthlyCost;
    }

    // Beräkna kostnad baserat på vald avtalslängd
    const monthlyKwh = effectiveKwh;
    const monthlyCost = (selectedContract?.fastpris || 0) * monthlyKwh + (selectedContract?.månadskostnad || 0);
    return monthlyCost;
  };

  return (
    <div className="space-y-6">
      {/* Header - Sticky on contracts page */}
      <div className={`text-center ${enableConsumptionEntry ? 'sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 mb-6 border-b border-border shadow-sm' : ''}`}>
        <h2 className="text-2xl font-bold mb-2">Bästa alternativen för dig</h2>
        {enableConsumptionEntry ? (
          <div className="flex items-center justify-center gap-3 text-muted">
            <span>Ange din förbrukning</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="kWh/månad"
                className="w-32 px-3 py-1 border-2 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm text-gray-900"
                style={{
                  borderColor: 'rgb(0, 135, 90)',
                  animation: 'pulse-border 2s ease-in-out infinite'
                }}
                value={enteredKwh === null ? '' : enteredKwh}
                onChange={(e) => {
                  const val = e.target.value;
                  setEnteredKwh(val === '' ? null : Math.max(0, Number(val)));
                }}
              />
              <span className="text-sm">kWh/månad</span>
            </div>
          </div>
        ) : (
          <p className="text-muted">Baserat på din förbrukning ({billData.totalKWh} kWh/månad)</p>
        )}
      </div>

      {/* Bästa alternativet */}
      {bestOption && bestOption.estimatedSavings > 0 && (
        <div
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg shadow-lg border-2 border-primary/20 p-6 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              <Star className="w-4 h-4" />
              Mest populär
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={resolveProviderLogo(bestOption.provider.name, bestOption.provider.logoUrl)}
                  alt={`${bestOption.provider.name} logo`}
                  onError={createProviderLogoErrorHandler(bestOption.provider.name)}
                  className="h-20 w-auto object-contain max-w-[160px]"
                  style={{
                    imageRendering: 'crisp-edges',
                    WebkitImageRendering: 'crisp-edges'
                  } as React.CSSProperties}
                  loading="lazy"
                />
                <h3 className="text-xl font-bold">{bestOption.provider.name}</h3>
              </div>
              <p className="text-muted mb-4">{bestOption.provider.description}</p>

              {/* Avtalslängd dropdown för fastpris */}
              {bestOptionHasMultipleAreaOptions && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Välj avtalslängd
                  </label>
                  <div className="relative">
                        <select
                          value={selectedContracts[bestOption.provider.id] || 0}
                          onChange={(e) => handleContractChange(bestOption.provider.id, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white pr-8"
                        >
                          {bestOptionAreaOptions.map((contract, index) => (
                            <option key={index} value={index}>
                              {contract.namn} - {formatPricePerKwh(contract.fastpris || 0)}
                            </option>
                          ))}
                        </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted">Månadskostnad</p>
                  <p className="font-semibold">
                    {(() => {
                      const selectedContract = getSelectedContract(bestOption.provider);
                      const monthlyFee = selectedContract?.månadskostnad || bestOption.provider.monthlyFee;
                      return monthlyFee === 0 ? "0 kr" : `${monthlyFee} kr`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">
                    {bestOption.provider.contractType === "rörligt" ? "Påslag" : "Fastpris"}
                  </p>
                  <p className="font-semibold">
                    {(() => {
                      const selectedContract = getSelectedContract(bestOption.provider);
                      const price = selectedContract?.fastpris || lookupSurcharges[bestOption.provider.id] || bestOption.provider.energyPrice;
                      return formatPricePerKwh(price);
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {getTags(bestOption.provider).map((feature, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full text-sm"
                  >
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-muted mb-1">Nytt pris</p>
                <p className="text-3xl font-bold text-success">
                  {showPrices ? (
                    formatCurrency(calculateProviderCost(bestOption, getSelectedContract(bestOption.provider)))
                  ) : (
                    '—'
                  )}
                </p>
                <p className="text-sm text-muted">per månad</p>
              </div>
              
              <button 
                onClick={() => handleSwitchClick(bestOption)}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Byt till {bestOption.provider.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Andra alternativ */}
      <div className="space-y-6">
        {variableComparisons.length > 0 && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-4">Rörligt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variableComparisons.map(renderComparisonCard)}
            </div>
          </>
        )}

        {onRequestContact && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 md:p-8 text-center border-2 border-primary/20">
            <h2 className="text-2xl font-bold mb-3">
              Behöver du personlig hjälp att välja?
            </h2>
            <p className="text-muted mb-6">
              Vi hjälper dig hitta det bästa elavtalet för just din situation och sköter bytet åt dig.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onRequestContact}
                className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all"
              >
                Ja, jag vill ha personlig hjälp
              </button>
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        )}

        {fixedComparisons.length > 0 && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-4">Fastpris</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fixedComparisons.map(renderComparisonCard)}
            </div>
          </>
        )}
      </div>

      {/* Sammanfattning */}
      <div
        className="bg-primary/5 border border-primary/10 rounded-lg p-4"
      >
        <p className="text-sm text-muted text-center">
          💡 <strong>Tips:</strong> Jämförelsen baseras på din nuvarande förbrukning och aktuella marknadspriser. 
          Faktiska priser kan variera beroende på avtal och marknadsförhållanden.
        </p>
      </div>

      {/* Switch Process Modal */}
      {showSwitchProcess && selectedProvider && (
        <SwitchProcess
          provider={selectedProvider.provider}
          billData={billData}
          savings={savings || {
            currentCost: currentCost,
            cheapestAlternative: selectedProvider.estimatedMonthlyCost,
            potentialSavings: selectedProvider.estimatedSavings,
            savingsPercentage: 0
          }}
          selectedContract={getSelectedContract(selectedProvider.provider)}
          onClose={() => setShowSwitchProcess(false)}
          onComplete={handleSwitchComplete}
        />
      )}
    </div>
  );
}
