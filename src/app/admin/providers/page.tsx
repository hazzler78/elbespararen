"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Phone } from "lucide-react";
import type { ElectricityProvider, ApiResponse } from "@/lib/types";

export default function ProvidersAdminPage() {
  const [providers, setProviders] = useState<ElectricityProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ElectricityProvider | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/providers");
      const result = await response.json() as ApiResponse<ElectricityProvider[]>;
      
      if (result.success && result.data) {
        setProviders(result.data);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProvider = async (providerData: Partial<ElectricityProvider>) => {
    try {
      console.log('[Admin] Adding provider:', providerData);
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(providerData),
      });

      console.log('[Admin] Response status:', response.status);
      const result = await response.json() as ApiResponse<ElectricityProvider>;
      console.log('[Admin] Response result:', result);
      
      if (result.success && result.data) {
        setProviders([...providers, result.data]);
        setShowAddForm(false);
        alert('✅ Leverantör tillagd!');
        // Uppdatera listan
        fetchProviders();
      } else {
        alert('❌ Kunde inte lägga till leverantör: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error adding provider:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const handleToggleActive = async (provider: ElectricityProvider) => {
    try {
      console.log('[Admin] Toggling active for provider:', provider.id);
      const response = await fetch("/api/providers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: provider.id,
          isActive: !provider.isActive
        }),
      });

      console.log('[Admin] Toggle response status:', response.status);
      const result = await response.json() as ApiResponse<ElectricityProvider>;
      console.log('[Admin] Toggle response result:', result);
      
      if (result.success && result.data) {
        // Use functional update to avoid stale closure issues
        setProviders(prevProviders => {
          if (!prevProviders || !Array.isArray(prevProviders)) {
            console.error('[Admin] Providers state is not an array:', prevProviders);
            return [];
          }
          return prevProviders.map(p => p.id === provider.id ? result.data! : p);
        });
        alert('✅ Leverantör uppdaterad!');
      } else {
        alert('❌ Kunde inte uppdatera leverantör: ' + (result.error || 'Okänt fel'));
      }
    } catch (error) {
      console.error("Error updating provider:", error);
      alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm("Är du säker på att du vill ta bort denna leverantör?")) {
      try {
        console.log('[Admin] Deleting provider:', providerId);
        const response = await fetch(`/api/providers?id=${providerId}`, {
          method: "DELETE",
        });

        const result = await response.json() as ApiResponse<{ message: string }>;
        
        if (result.success) {
          setProviders(providers.filter(p => p.id !== providerId));
          alert('✅ Leverantör borttagen!');
        } else {
          alert('❌ Kunde inte ta bort leverantör: ' + (result.error || 'Okänt fel'));
        }
      } catch (error) {
        console.error("Error deleting provider:", error);
        alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Laddar leverantörer...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Hantera Elleverantörer</h1>
              <p className="text-muted">Administrera leverantörer och deras priser</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Lägg till leverantör
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Totalt leverantörer</p>
            <p className="text-3xl font-bold">{providers.length}</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Aktiva</p>
            <p className="text-3xl font-bold text-success">
              {providers.filter(p => p.isActive).length}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Inaktiva</p>
            <p className="text-3xl font-bold text-error">
              {providers.filter(p => !p.isActive).length}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6">
            <p className="text-sm text-muted uppercase tracking-wide mb-2">Billigaste pris</p>
            <p className="text-3xl font-bold text-secondary">
              {providers && providers.length > 0 ? Math.min(...providers.map(p => p.energyPrice)).toFixed(2) : '0.00'} kr/kWh
            </p>
          </div>
        </div>

        {/* Providers List */}
        <div className="bg-white rounded-lg border border-border">
          {providers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted">Inga leverantörer ännu</p>
              <p className="text-sm text-muted mt-2">
                Lägg till din första leverantör för att komma igång.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {providers && providers.length > 0 ? providers.map((provider) => (
                <div key={provider.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{provider.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          provider.isActive 
                            ? "bg-success/10 text-success" 
                            : "bg-error/10 text-error"
                        }`}>
                          {provider.isActive ? "Aktiv" : "Inaktiv"}
                        </span>
                      </div>
                      <p className="text-muted mb-3">{provider.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted">Månadskostnad</p>
                          <p className="font-semibold">
                            {provider.monthlyFee === 0 ? "0 kr" : `${provider.monthlyFee} kr`}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">Påslag</p>
                          <p className="font-semibold">{Number(provider.energyPrice).toFixed(2)} kr/kWh</p>
                        </div>
                        <div>
                          <p className="text-muted">Gratis månader</p>
                          <p className="font-semibold">{provider.freeMonths} mån</p>
                        </div>
                        <div>
                          <p className="text-muted">Bindningstid</p>
                          <p className="font-semibold">{provider.contractLength} mån</p>
                        </div>
                        <div>
                          <p className="text-muted">Avtalstyp</p>
                          <p className="font-semibold">
                            {provider.contractType === "rörligt" ? "Rörligt" : "Fastpris"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {provider.features.map((feature, index) => (
                          <span
                            key={index}
                            className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(provider)}
                        className="p-2 text-muted hover:text-foreground transition-colors"
                        title={provider.isActive ? "Gör inaktiv" : "Gör aktiv"}
                      >
                        {provider.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('[Admin] Edit button clicked for provider:', provider.id);
                          setEditingProvider(provider);
                        }}
                        className="p-2 text-muted hover:text-primary transition-colors"
                        title="Redigera"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="p-2 text-muted hover:text-error transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted">
                    {provider.websiteUrl && (
                      <a
                        href={provider.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Hemsida
                      </a>
                    )}
                    {provider.phoneNumber && (
                      <a
                        href={`tel:${provider.phoneNumber}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        {provider.phoneNumber}
                      </a>
                    )}
                    <span>Skapad: {new Date(provider.createdAt).toLocaleDateString("sv-SE")}</span>
                  </div>
                </div>
              )) : null}
            </div>
          )}
        </div>

        {/* Add Provider Form */}
        {showAddForm && (
          <ProviderForm
            onSave={handleAddProvider}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Edit Provider Form */}
        {editingProvider && (
          <ProviderForm
            provider={editingProvider}
            onSave={async (data) => {
              try {
                console.log('[Admin] Updating provider - onSave called with data:', data);
                console.log('[Admin] Editing provider ID:', editingProvider.id);
                const response = await fetch("/api/providers", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: editingProvider.id,
                    ...data
                  }),
                });

                const result = await response.json() as ApiResponse<ElectricityProvider>;
                
                if (result.success && result.data) {
                  setProviders(prevProviders => {
                    if (!prevProviders || !Array.isArray(prevProviders)) {
                      console.error('[Admin] Providers state is not an array during edit:', prevProviders);
                      return [];
                    }
                    return prevProviders.map(p => p.id === editingProvider.id ? result.data! : p);
                  });
                  setEditingProvider(null);
                  alert('✅ Leverantör uppdaterad!');
                } else {
                  alert('❌ Kunde inte uppdatera leverantör: ' + (result.error || 'Okänt fel'));
                }
              } catch (error) {
                console.error("Error updating provider:", error);
                alert('❌ Nätverksfel: ' + (error instanceof Error ? error.message : 'Okänt fel'));
              }
            }}
            onCancel={() => setEditingProvider(null)}
          />
        )}
      </div>
    </main>
  );
}

// Provider Form Component
function ProviderForm({ 
  provider, 
  onSave, 
  onCancel 
}: { 
  provider?: ElectricityProvider; 
  onSave: (data: Partial<ElectricityProvider>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: provider?.name || "",
    description: provider?.description || "",
    monthlyFee: provider?.monthlyFee || 0,
    energyPrice: provider?.energyPrice || 0,
    freeMonths: provider?.freeMonths || 0,
    contractLength: provider?.contractLength || 12,
    contractType: provider?.contractType || "rörligt" as "rörligt" | "fastpris",
    isActive: provider?.isActive ?? true,
    features: provider?.features || [],
    logoUrl: provider?.logoUrl || "",
    websiteUrl: provider?.websiteUrl || "",
    phoneNumber: provider?.phoneNumber || "",
  });

  const [newFeature, setNewFeature] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resolveLogoUrl = (raw: string) => {
    const value = (raw || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value; // absolute URL
    if (value.startsWith("/")) return value; // already relative from public
    const withFolder = `/logos/${value}`;
    // append .svg if no extension provided
    return /\.[a-zA-Z0-9]+$/.test(withFolder) ? withFolder : `${withFolder}.svg`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {provider ? "Redigera leverantör" : "Lägg till leverantör"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Namn *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Månadskostnad (kr) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Påslag (kr/kWh) *</label>
              <input
                type="number"
                step="0.001"
                value={formData.energyPrice}
                onChange={(e) => setFormData({ ...formData, energyPrice: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gratis månader</label>
              <input
                type="number"
                value={formData.freeMonths}
                onChange={(e) => setFormData({ ...formData, freeMonths: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bindningstid (månader)</label>
              <input
                type="number"
                value={formData.contractLength}
                onChange={(e) => setFormData({ ...formData, contractLength: Number(e.target.value) })}
                className="w-full border border-border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avtalstyp *</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as "rörligt" | "fastpris" })}
                className="w-full border border-border rounded-lg px-3 py-2"
                required
              >
                <option value="rörligt">Rörligt avtal (påslag på spotpris)</option>
                <option value="fastpris">Fastprisavtal (fast pris per kWh)</option>
              </select>
              <p className="text-xs text-muted mt-1">
                {formData.contractType === "rörligt" 
                  ? "Priset varierar med spotpriset + påslag" 
                  : "Fast pris per kWh under hela avtalsperioden"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefonnummer</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2"
              />
            </div>

          <div>
            <label className="block text-sm font-medium mb-1">Logotyp URL</label>
            <input
              type="text"
              placeholder="/logos/cheap-energy.svg eller https://..."
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2"
            />
            {formData.logoUrl && (
              <div className="mt-2 p-2 border border-border rounded-lg bg-white">
                <p className="text-xs text-muted mb-1">Förhandsgranskning</p>
                <img src={resolveLogoUrl(formData.logoUrl)} alt="Logo preview" className="h-10 w-auto object-contain" />
                <p className="mt-1 text-[11px] text-muted">Visar: {resolveLogoUrl(formData.logoUrl)}</p>
              </div>
            )}
          </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 h-20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hemsida</label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Funktioner</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Lägg till funktion..."
                className="flex-1 border border-border rounded-lg px-3 py-2"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Lägg till
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-primary/70 hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Aktiv leverantör
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Sparar..." : (provider ? "Uppdatera" : "Skapa")} leverantör
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 border border-border py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
