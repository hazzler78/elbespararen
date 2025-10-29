-- Migration 0019: Update customer_info to include paymentMethod
-- Uppdaterar customer_info JSON-struktur för att inkludera paymentMethod istället för preferredContactMethod

-- Denna migration behöver inte ändra tabellstrukturen eftersom customer_info lagras som JSON
-- Men vi dokumenterar ändringen för framtida referens

-- Fält som nu inkluderas i customer_info JSON:
-- - firstName: string
-- - lastName: string  
-- - email: string
-- - phone: string
-- - address: Address (JSON objekt)
-- - personalNumber?: string (valfritt)
-- - paymentMethod: "autogiro" | "faktura" | "bankgiro" (nytt fält)
-- - consentToMarketing: boolean
-- - consentToDataProcessing: boolean

-- Fält som tagits bort:
-- - preferredContactMethod: "email" | "phone" | "sms" (ersatt av paymentMethod)

-- Detta påverkar:
-- 1. SwitchProcess.tsx - formulärfält uppdaterat
-- 2. types.ts - CustomerInfo interface uppdaterat  
-- 3. admin/switch-requests/page.tsx - CSV export använder paymentMethod för "Betalsätt" kolumn

-- Inga SQL-ändringar behövs eftersom data lagras som JSON i customer_info kolumnen
