-- 🧹 Cleanup script för att ta bort felaktiga Fastpris-leverantörer
-- Kör detta i Cloudflare D1 Console för att rensa de leverantörer som skapades felaktigt

-- Visa vilka leverantörer som finns nu
SELECT id, name, contract_type, monthly_fee, energy_price, created_at 
FROM electricity_providers 
ORDER BY created_at DESC;

-- Ta bort alla Fastpris-leverantörer som skapades via prisuppdatering
-- (behåll bara de som du vill ha)
DELETE FROM electricity_providers 
WHERE contract_type = 'fastpris' 
  AND created_at >= '2025-01-21'; -- Anpassa datumet baserat på när prisuppdateringen kördes

-- Visa resultatet
SELECT COUNT(*) as remaining_providers, contract_type 
FROM electricity_providers 
GROUP BY contract_type;

-- Visa kvarvarande leverantörer
SELECT id, name, contract_type, monthly_fee, energy_price 
FROM electricity_providers 
ORDER BY contract_type, name;
