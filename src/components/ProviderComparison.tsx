"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Star, ExternalLink, Phone, Zap } from "lucide-react";
import type { ProviderComparison, BillData, SavingsCalculation, SwitchRequest, ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
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

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/providers/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ billData }),
        });

        const result = await response.json() as ApiResponse<ComparisonData>;

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
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20 p-6 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              <Star className="w-4 h-4" />
              Bästa val
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-2">{bestOption.provider.name}</h3>
              <p className="text-muted mb-4">{bestOption.provider.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted">Månadskostnad</p>
                  <p className="font-semibold">
                    {bestOption.provider.monthlyFee === 0 ? "0 kr" : `${bestOption.provider.monthlyFee} kr`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">Energipris</p>
                  <p className="font-semibold">{bestOption.provider.energyPrice} kr/kWh</p>
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
                <p className="text-sm text-muted mb-1">Din besparing</p>
                <p className="text-3xl font-bold text-success">
                  {formatCurrency(bestOption.estimatedSavings)}
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
                <h3 className="font-bold text-lg">{comparison.provider.name}</h3>
                <p className="text-sm text-muted">{comparison.provider.description}</p>
              </div>
              {comparison.isRecommended && (
                <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs">
                  <Zap className="w-3 h-3" />
                  Rekommenderad
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted">Månadskostnad</p>
                <p className="font-semibold">
                  {comparison.provider.monthlyFee === 0 ? "0 kr" : `${comparison.provider.monthlyFee} kr`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Energipris</p>
                <p className="font-semibold">{comparison.provider.energyPrice} kr/kWh</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted">Beräknad kostnad</p>
                <p className="font-bold text-lg">
                  {formatCurrency(comparison.estimatedMonthlyCost)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Besparing</p>
                <p className={`font-bold ${comparison.estimatedSavings > 0 ? 'text-success' : 'text-error'}`}>
                  {comparison.estimatedSavings > 0 ? '+' : ''}{formatCurrency(comparison.estimatedSavings)}
                </p>
              </div>
            </div>

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
