"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  User, 
  Home, 
  FileText, 
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle
} from "lucide-react";
import { ElectricityProvider, BillData, SavingsCalculation, SwitchRequest, CustomerInfo, CurrentProviderInfo, ApiResponse, ContractAlternative } from "@/lib/types";
import { formatPricePerKwh } from "@/lib/calculations";
import SwitchConfirmation from "./SwitchConfirmation";
import { Info } from "lucide-react";

interface SwitchProcessProps {
  provider: ElectricityProvider;
  billData: BillData;
  savings: SavingsCalculation;
  selectedContract?: ContractAlternative | null;
  onClose: () => void;
  onComplete: (switchRequest: SwitchRequest) => void;
}

interface FormData {
  // Kunduppgifter
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalNumber: string;
  paymentMethod: "autogiro" | "faktura" | "bankgiro";
  consentToMarketing: boolean;
  consentToDataProcessing: boolean;
  
  // Adress
  street: string;
  streetNumber: string;
  apartment: string;
  postalCode: string;
  city: string;
  
  // Nuvarande leverantör
  currentProviderName: string;
  currentCustomerNumber: string;
  currentContractEndDate: string;
}

const steps = [
  { id: 1, title: "Kunduppgifter", icon: User, description: "Dina personuppgifter" },
  { id: 2, title: "Adress", icon: Home, description: "Din adress" },
  { id: 3, title: "Nuvarande leverantör", icon: FileText, description: "Information om din nuvarande leverantör" },
  { id: 4, title: "Sammanfattning", icon: CheckCircle2, description: "Granska och bekräfta" }
];

export default function SwitchProcess({ provider, billData, savings, selectedContract, onClose, onComplete }: SwitchProcessProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedSwitchRequest, setCompletedSwitchRequest] = useState<SwitchRequest | null>(null);
  const [providerPriceInfo, setProviderPriceInfo] = useState<null | {
    area: string;
    range: { min: number; max: number };
    surcharge?: number;
    el_certificate_fee?: number;
    _12_month_discount?: number;
    price?: number;
    monthly_fee?: number;
    total?: number;
    total_with_vat?: number;
    vat?: number;
  }>(null);

  // Session timeout - 30 minuter
  useEffect(() => {
    const timeout = setTimeout(() => {
      alert("Din session har gått ut. Priser kan ha ändrats sedan du påbörjade bytet. Du omdirigeras tillbaka för att se de senaste priserna.");
      window.location.href = "/result";
    }, 30 * 60 * 1000); // 30 minuter

    return () => clearTimeout(timeout);
  }, []);
  
  // Load normalized price via server-side lookup (cached)
  useEffect(() => {
    const area = (billData.priceArea || 'se3').toLowerCase();
    (async () => {
      try {
        const res = await fetch('/api/prices/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerName: provider?.name || '', area, kwh: billData.totalKWh })
        });
        const json = await res.json();
        if (json?.success && json?.data) {
          const d = json.data as {
            area: string;
            range: { min: number; max: number } | null;
            surcharge?: number; el_certificate_fee?: number; _12_month_discount?: number;
            price?: number; monthly_fee?: number; total?: number; total_with_vat?: number; vat?: number;
          };
          setProviderPriceInfo({
            area: d.area,
            range: d.range || { min: 0, max: billData.totalKWh },
            surcharge: d.surcharge,
            el_certificate_fee: d.el_certificate_fee,
            _12_month_discount: d._12_month_discount,
            price: d.price,
            monthly_fee: d.monthly_fee,
            total: d.total,
            total_with_vat: d.total_with_vat,
            vat: d.vat
          });
        } else {
          setProviderPriceInfo(null);
        }
      } catch (e) {
        console.warn('Price lookup failed', e);
      }
    })();
  }, [provider?.name, billData.priceArea, billData.totalKWh]);

  const buildTooltip = (): string => {
    if (!providerPriceInfo) return '';
    const p = providerPriceInfo;
    const fmt = (v?: number) => (typeof v === 'number' ? String(v) : '-');
    return [
      `Område: ${p.area.toUpperCase()} (förbrukning ${p.range.min}-${p.range.max} kWh/mån)`,
      `Påslag: ${fmt(p.surcharge)} öre/kWh`,
      `Elcertifikat: ${fmt(p.el_certificate_fee)} öre/kWh`,
      `12 mån rabatt: ${fmt(p._12_month_discount)} öre/kWh`,
      `Pris: ${fmt(p.price)} öre/kWh`,
      `Månadsavgift: ${fmt(p.monthly_fee)} kr/mån`,
      `Total (exkl. moms): ${fmt(p.total)}`,
      `Total (inkl. moms): ${fmt(p.total_with_vat)}`,
      `Moms: ${fmt(p.vat)}`
    ].join('\n');
  };
  // Beräkna 14 dagar framåt som standard datum
  const getDefaultContractEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    personalNumber: "",
    paymentMethod: "autogiro",
    consentToMarketing: false,
    consentToDataProcessing: false,
    street: "",
    streetNumber: "",
    apartment: "",
    postalCode: "",
    city: "",
    currentProviderName: "",
    currentCustomerNumber: "",
    currentContractEndDate: getDefaultContractEndDate()
  });

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Skapa switch request
      const customerInfo: CustomerInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        personalNumber: formData.personalNumber,
        address: {
          street: formData.street,
          streetNumber: formData.streetNumber,
          apartment: formData.apartment,
          postalCode: formData.postalCode,
          city: formData.city,
          country: "Sverige"
        },
        paymentMethod: formData.paymentMethod,
        consentToMarketing: formData.consentToMarketing,
        consentToDataProcessing: formData.consentToDataProcessing
      };

      const currentProvider: CurrentProviderInfo = {
        name: formData.currentProviderName,
        customerNumber: formData.currentCustomerNumber,
        contractEndDate: formData.currentContractEndDate,
        currentMonthlyCost: billData.totalAmount
      };

      const switchRequest: SwitchRequest = {
        id: `switch-${Date.now()}`,
        customerInfo,
        currentProvider,
        newProvider: provider,
        billData,
        savings,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Spara till databas via API
      const response = await fetch("/api/switch-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(switchRequest),
      });

      const result = await response.json() as ApiResponse<SwitchRequest>;
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Kunde inte skapa bytförfrågan");
      }
      
      setCompletedSwitchRequest(result.data);
      setShowConfirmation(true);
      onComplete(result.data);
    } catch (error) {
      console.error("Error submitting switch request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.consentToDataProcessing);
      case 2:
        return !!(formData.street && formData.streetNumber && formData.postalCode && formData.city);
      case 3:
        return /^\d{18}$/.test(formData.currentCustomerNumber);
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (showConfirmation && completedSwitchRequest) {
    return (
      <SwitchConfirmation
        switchRequest={completedSwitchRequest}
        onClose={() => {
          setShowConfirmation(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="pr-4">
              <h2 className="text-xl sm:text-2xl font-bold">Byt till {provider.name}</h2>
              <p className="text-primary-foreground/80 mt-1 text-sm hidden sm:block">
                Vi hjälper dig genom hela bytet - det tar bara några minuter
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-primary-foreground/80 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 sm:px-6 py-4 border-b border-border flex-shrink-0">
          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${isActive ? 'bg-primary border-primary text-white' : ''}
                    ${isCompleted ? 'bg-success border-success text-white' : ''}
                    ${!isActive && !isCompleted ? 'border-border text-muted' : ''}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-muted">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted mx-4" />
                  )}
                </div>
              );
            })}
          </div>
          {/* Mobile progress indicator */}
          <div className="md:hidden">
            {(() => {
              const step = steps.find(s => s.id === currentStep);
              const Icon = step?.icon || User;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary bg-primary text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{step?.title}</p>
                    <p className="text-sm text-muted">Steg {currentStep} av {steps.length}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

                {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
          <div>
            {currentStep === 1 && (
              <div
                key="step1"
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold mb-4">Dina personuppgifter</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Förnamn *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Efternamn *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">E-post *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Telefon *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Personnummer</label>
                      <input
                        type="text"
                        value={formData.personalNumber}
                        onChange={(e) => updateFormData('personalNumber', e.target.value)}
                        placeholder="YYYYMMDD-XXXX"
                        className="w-full border border-border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Betalningssätt</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                      >
                        <option value="autogiro">Autogiro</option>
                        <option value="faktura">Faktura</option>
                        <option value="bankgiro">Bankgiro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consentData"
                        checked={formData.consentToDataProcessing}
                        onChange={(e) => updateFormData('consentToDataProcessing', e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="consentData" className="text-sm">
                        Jag samtycker till att mina personuppgifter behandlas för att genomföra elavtalet *
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consentMarketing"
                        checked={formData.consentToMarketing}
                        onChange={(e) => updateFormData('consentToMarketing', e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="consentMarketing" className="text-sm">
                        Jag vill få erbjudanden om elavtal och energitjänster via e-post och SMS
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div
                key="step2"
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold mb-4">Din adress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Gatuadress *</label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => updateFormData('street', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gatunummer *</label>
                      <input
                        type="text"
                        value={formData.streetNumber}
                        onChange={(e) => updateFormData('streetNumber', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lägenhetsnummer</label>
                      <input
                        type="text"
                        value={formData.apartment}
                        onChange={(e) => updateFormData('apartment', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postnummer *</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => updateFormData('postalCode', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ort *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div
                key="step3"
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold mb-4">Din nuvarande leverantör</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Leverantörsnamn</label>
                      <input
                        type="text"
                        value={formData.currentProviderName}
                        onChange={(e) => updateFormData('currentProviderName', e.target.value)}
                        placeholder="t.ex. E.ON, Fortum, Vattenfall"
                        className="w-full border border-border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Anläggnings-id 18 siffror *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.currentCustomerNumber}
                        onChange={(e) => updateFormData('currentCustomerNumber', e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 735999123456789012"
                        maxLength={18}
                        className="w-full border border-border rounded-lg px-3 py-2"
                        required
                      />
                      {formData.currentCustomerNumber && formData.currentCustomerNumber.length !== 18 && (
                        <p className="text-xs text-error mt-1">Anläggnings-id måste vara exakt 18 siffror</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">När vill du byta leverantör?</label>
                      <input
                        type="date"
                        value={formData.currentContractEndDate}
                        onChange={(e) => updateFormData('currentContractEndDate', e.target.value)}
                        min={getDefaultContractEndDate()}
                        max={(() => {
                          const maxDate = new Date();
                          maxDate.setMonth(maxDate.getMonth() + 3);
                          return maxDate.toISOString().split('T')[0];
                        })()}
                        className="w-full border border-border rounded-lg px-3 py-2"
                      />
                      <p className="text-xs text-muted mt-1">
                        Du kan välja datum från idag upp till 3 månader framåt
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div
                key="step4"
                className="space-y-4 pb-8"
              >
                <div>
                  <h3 className="text-xl font-bold mb-4">Sammanfattning</h3>
                  
                  {/* Pris/Besparing */}
                  {provider.contractType === "fastpris" ? (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-primary mb-1 text-sm flex items-center gap-2">
                        Ditt valda avtal med {provider.name}
                        <span
                          title={buildTooltip() || 'Ingen prisinformation tillgänglig'}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary cursor-help"
                          aria-label="Mer information om priset"
                        >
                          <Info className="w-3 h-3" />
                        </span>
                      </h4>
                      <p className="text-xl font-bold text-primary">
                        {selectedContract?.fastpris ? formatPricePerKwh(selectedContract.fastpris) : formatPricePerKwh(provider.energyPrice)}
                      </p>
                      <p className="text-xs text-muted">
                        {selectedContract?.namn || "Fastpris under hela avtalsperioden"}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-success mb-1 text-sm flex items-center gap-2">
                        Din besparing med {provider.name}
                        <span
                          title={buildTooltip() || 'Ingen prisinformation tillgänglig'}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-success/20 text-success cursor-help"
                          aria-label="Mer information om priset"
                        >
                          <Info className="w-3 h-3" />
                        </span>
                      </h4>
                      <p className="text-xl font-bold text-success">
                        {savings.potentialSavings} kr per månad
                      </p>
                      <p className="text-xs text-muted">
                        Från {savings.currentCost} kr till {savings.cheapestAlternative} kr
                      </p>
                    </div>
                  )}

                  {/* Kunduppgifter */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-semibold mb-1 text-sm">Kunduppgifter</h4>
                    <p className="text-sm">{formData.firstName} {formData.lastName}</p>
                    <p className="text-sm">{formData.email}</p>
                    <p className="text-sm">{formData.phone}</p>
                  </div>

                  {/* Adress */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-semibold mb-1 text-sm">Adress</h4>
                    <p className="text-sm">{formData.street} {formData.streetNumber}{formData.apartment && `, ${formData.apartment}`}</p>
                    <p className="text-sm">{formData.postalCode} {formData.city}</p>
                  </div>

                  {/* Nuvarande leverantör */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-semibold mb-1 text-sm">Nuvarande leverantör</h4>
                    <p className="text-sm">{formData.currentProviderName}</p>
                    {formData.currentCustomerNumber && <p className="text-sm">Anläggnings-id: {formData.currentCustomerNumber}</p>}
                    {formData.currentContractEndDate && <p className="text-sm">Avtalslut: {formData.currentContractEndDate}</p>}
                  </div>

                  {/* Ny leverantör */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                    <h4 className="font-semibold mb-1 text-sm">Ny leverantör: {provider.name}</h4>
                    <p className="text-xs text-muted mb-2">{provider.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted">Månadskostnad</p>
                        <p className="font-semibold">
                          {provider.monthlyFee === 0 ? "0 kr" : `${provider.monthlyFee} kr`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">
                          {provider.contractType === "rörligt" ? "Påslag" : "Fastpris"}
                        </p>
                        <p className="font-semibold">
                          {selectedContract?.fastpris ? formatPricePerKwh(selectedContract.fastpris) : formatPricePerKwh(Number(provider.energyPrice))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Viktig information */}
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-warning mb-1 text-sm">Viktig information</h4>
                        <ul className="text-xs text-muted space-y-0.5">
                          <li>• Vi sköter hela bytet åt dig</li>
                          <li>• Du får bekräftelse via e-post</li>
                          <li>• Bytet genomförs enligt uppsägningstiden från din nuvarande leverantör</li>
                          <li>• Du kan avbryta bytet fram till bekräftelse från {provider.name}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 sm:p-6 bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <span className="text-sm text-muted text-center sm:text-left">
                Steg {currentStep} av {steps.length}
              </span>
              
              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Nästa
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-success text-white px-6 py-2 rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Skickar...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Bekräfta bytet
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
