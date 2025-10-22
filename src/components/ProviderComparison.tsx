"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Star, ExternalLink, Phone, Zap, ChevronDown } from "lucide-react";
import type { ProviderComparison, BillData, SavingsCalculation, SwitchRequest, ApiResponse, ContractAlternative } from "@/lib/types";
import { formatCurrency, formatPricePerKwh } from "@/lib/calculations";
import SwitchProcess from "./SwitchProcess";

interface ProviderComparisonProps {
  billData: BillData;
  savings?: SavingsCalculation;
}

interface ComparisonData {
  currentCost: number;
  comparisons: ProviderComparison[];
  totalProviders: number;
  recommendedProviders: number;
}

export default function ProviderComparison({ billData, savings }: ProviderComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSwitchProcess, setShowSwitchProcess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderComparison | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<Record<string, number>>({}); // providerId -> selectedContractIndex

  const toKebab = (value: string) =>
    value
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const getFallbackLogo = (name: string) => `/logos/${toKebab(name)}.svg`;

  const getLogoUrl = (name: string, logoUrl?: string) => {
    // Use provided URL if present; otherwise fallback to kebab-case svg
    if (logoUrl && logoUrl.trim().length > 0) return logoUrl;
    return getFallbackLogo(name);
  };

  const handleLogoError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const element = e.currentTarget;
    const providerName = element.getAttribute('data-provider-name');
    if (!providerName) return;
    const fallback = getFallbackLogo(providerName);
    if (element.src.endsWith(fallback)) return; // already tried
    element.src = fallback;
  };

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        setIsLoading(true);
        console.log('[ProviderComparison] Sending billData:', billData);
        const response = await fetch("/api/providers/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ billData }),
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

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg border border-border p-6"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted">Jämför leverantörer...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg border border-border p-6"
      >
        <div className="text-center py-8">
          <p className="text-error mb-2">Kunde inte ladda jämförelser</p>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!comparisonData || comparisonData.comparisons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg border border-border p-6"
      >
        <div className="text-center py-8">
          <p className="text-muted">Inga leverantörer tillgängliga för jämförelse</p>
        </div>
      </motion.div>
    );
  }

  const { comparisons, currentCost } = comparisonData;
  const bestOption = comparisons[0];

  const handleSwitchClick = (comparison: ProviderComparison) => {
    setSelectedProvider(comparison);
    setShowSwitchProcess(true);
  };

  const handleSwitchComplete = (switchRequest: SwitchRequest) => {
    console.log("Switch request completed:", switchRequest);
    setShowSwitchProcess(false);
    // TODO: Visa bekräftelse eller redirect
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
    
    const selectedIndex = selectedContracts[provider.id] || 0;
    return provider.avtalsalternativ[selectedIndex] || provider.avtalsalternativ[0];
  };

  const calculateProviderCost = (comparison: ProviderComparison, selectedContract?: ContractAlternative | null) => {
    if (!selectedContract || comparison.provider.contractType === "rörligt") {
      return comparison.estimatedMonthlyCost;
    }

    // Beräkna kostnad baserat på vald avtalslängd
    const monthlyKwh = billData.totalKWh;
    const monthlyCost = (selectedContract.fastpris || 0) * monthlyKwh + (selectedContract.månadskostnad || 0);
    return monthlyCost;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Bästa alternativen för dig</h2>
        <p className="text-muted">
          Baserat på din förbrukning ({billData.totalKWh} kWh/månad)
        </p>
      </div>

      {/* Bästa alternativet */}
      {bestOption && bestOption.estimatedSavings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg shadow-lg border-2 border-primary/20 p-6 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              <Star className="w-4 h-4" />
              Bästa val
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={getLogoUrl(bestOption.provider.name, bestOption.provider.logoUrl)}
                  alt={`${bestOption.provider.name} logo`}
                  data-provider-name={bestOption.provider.name}
                  onError={handleLogoError}
                  className="h-20 w-auto object-contain"
                  loading="lazy"
                />
                <h3 className="text-xl font-bold">{bestOption.provider.name}</h3>
              </div>
              <p className="text-muted mb-4">{bestOption.provider.description}</p>
              
              {/* Avtalslängd dropdown för fastpris */}
              {bestOption.provider.contractType === "fastpris" && bestOption.provider.avtalsalternativ && bestOption.provider.avtalsalternativ.length > 1 && (
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
                      {bestOption.provider.avtalsalternativ.map((contract, index) => (
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
                      const price = selectedContract?.fastpris || bestOption.provider.energyPrice;
                      return formatPricePerKwh(price);
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {bestOption.provider.features.map((feature, index) => (
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
                  {formatCurrency(calculateProviderCost(bestOption, getSelectedContract(bestOption.provider)))}
                </p>
                <p className="text-sm text-muted">per månad</p>
              </div>
              
              <div className="space-y-2">
              <button 
                onClick={() => handleSwitchClick(bestOption)}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Byt till {bestOption.provider.name}
              </button>
                {bestOption.provider.websiteUrl && (
                  <a
                    href={bestOption.provider.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 text-primary border border-primary py-2 px-4 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Besök hemsida
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Andra alternativ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparisons.slice(1).map((comparison, index) => (
          <motion.div
            key={comparison.provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={getLogoUrl(comparison.provider.name, comparison.provider.logoUrl)}
                    alt={`${comparison.provider.name} logo`}
                    data-provider-name={comparison.provider.name}
                    onError={handleLogoError}
                    className="h-12 w-auto object-contain"
                    loading="lazy"
                  />
                  <h3 className="font-bold text-lg">{comparison.provider.name}</h3>
                </div>
                <p className="text-sm text-muted">{comparison.provider.description}</p>
              </div>
              {comparison.isRecommended && (
                <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs">
                  <Zap className="w-3 h-3" />
                  Rekommenderad
                </div>
              )}
            </div>

            {/* Avtalslängd dropdown för fastpris */}
            {comparison.provider.contractType === "fastpris" && comparison.provider.avtalsalternativ && comparison.provider.avtalsalternativ.length > 1 && (
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
                    {comparison.provider.avtalsalternativ.map((contract, contractIndex) => (
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
                  {(() => {
                    const selectedContract = getSelectedContract(comparison.provider);
                    const monthlyFee = selectedContract?.månadskostnad || comparison.provider.monthlyFee;
                    return monthlyFee === 0 ? "0 kr" : `${monthlyFee} kr`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">
                  {comparison.provider.contractType === "rörligt" ? "Påslag" : "Fastpris"}
                </p>
                <p className="font-semibold">
                  {(() => {
                    const selectedContract = getSelectedContract(comparison.provider);
                    const price = selectedContract?.fastpris || comparison.provider.energyPrice;
                    return formatPricePerKwh(price);
                  })()}
                </p>
              </div>
            </div>

            {comparison.provider.contractType === "rörligt" && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted">Beräknad kostnad</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(calculateProviderCost(comparison, getSelectedContract(comparison.provider)))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Besparing</p>
                  <p className={`font-bold ${comparison.estimatedSavings > 0 ? 'text-success' : 'text-error'}`}>
                    {comparison.estimatedSavings > 0 ? '+' : ''}{formatCurrency(comparison.estimatedSavings)}
                  </p>
                </div>
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
          </motion.div>
        ))}
      </div>

      {/* Sammanfattning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-primary/5 border border-primary/10 rounded-lg p-4"
      >
        <p className="text-sm text-muted text-center">
          💡 <strong>Tips:</strong> Jämförelsen baseras på din nuvarande förbrukning och aktuella marknadspriser. 
          Faktiska priser kan variera beroende på avtal och marknadsförhållanden.
        </p>
      </motion.div>

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
          onClose={() => setShowSwitchProcess(false)}
          onComplete={handleSwitchComplete}
        />
      )}
    </motion.div>
  );
}
