# 🔄 Återställ Rörliga Leverantörer

## **🚨 Problem:**
Prisuppdateringssystemet skrev över dina Rörliga leverantörer med felaktiga Fastpris-leverantörer.

## **✅ Lösning:**

### **1. Rensa felaktiga Fastpris-leverantörer:**
```sql
-- Kör i Cloudflare D1 Console
DELETE FROM electricity_providers 
WHERE contract_type = 'fastpris' 
  AND created_at >= '2025-01-21';
```

### **2. Lägg till dina Rörliga leverantörer igen:**

#### **Via Admin-interface:**
1. Gå till `/admin/providers`
2. Klicka på "+ Lägg till leverantör"
3. Fyll i dina Rörliga leverantörer med:
   - **Avtalstyp:** Rörligt avtal
   - **Priser:** Dina ursprungliga priser

#### **Via SQL (snabbare):**
```sql
-- Exempel för dina två Rörliga leverantörer
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, 
  free_months, contract_length, contract_type, is_active, 
  features, created_at, updated_at
) VALUES 
(
  'provider-rörlig-1',
  'Din Rörliga Leverantör 1',
  'Beskrivning av din första rörliga leverantör',
  0, -- månadskostnad
  0.5, -- påslag per kWh
  0, -- gratis månader
  12, -- bindningstid
  'rörligt',
  1, -- aktiv
  '["Rörligt pris", "Ingen bindningstid"]',
  datetime('now'),
  datetime('now')
),
(
  'provider-rörlig-2', 
  'Din Rörliga Leverantör 2',
  'Beskrivning av din andra rörliga leverantör',
  29, -- månadskostnad
  0.3, -- påslag per kWh
  3, -- gratis månader
  24, -- bindningstid
  'rörligt',
  1, -- aktiv
  '["Rörligt pris", "24 månaders bindningstid"]',
  datetime('now'),
  datetime('now')
);
```

### **3. Verifiera:**
```sql
SELECT name, contract_type, monthly_fee, energy_price 
FROM electricity_providers 
ORDER BY contract_type, name;
```

## **🛡️ Framtida skydd:**
Det uppdaterade prisuppdateringssystemet kommer nu att:
- ✅ **Bara uppdatera Fastpris-leverantörer**
- ✅ **Inte skriva över Rörliga leverantörer**
- ✅ **Hämtar korrekt priser från JSON-endpoints**
- ✅ **Hanterar flera avtalsalternativ**

## **📋 Nästa steg:**
1. Rensa felaktiga leverantörer
2. Lägg till dina Rörliga leverantörer
3. Testa prisuppdateringen igen
4. Verifiera att endast Fastpris uppdateras
