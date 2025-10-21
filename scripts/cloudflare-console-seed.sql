-- Kör dessa SQL-kommandon direkt i Cloudflare Dashboard Console
-- Gå till: Cloudflare Dashboard > Workers & Pages > D1 SQL Database > elbespararen-db > Console

-- Steg 1: Rensa befintlig data (om någon finns)
DELETE FROM electricity_providers;
DELETE FROM switch_requests;
DELETE FROM leads;

-- Steg 2: Lägg till Cheap Energy
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, is_active, features, logo_url, website_url, 
  phone_number, created_at, updated_at
) VALUES (
  'cheap-energy-1',
  'Cheap Energy',
  'Billigaste alternativet med 0 kr i månadskostnad och 0 kr de första 12 månaderna',
  0,
  0.45,
  12,
  12,
  1,
  '["0 kr månadskostnad", "0 kr de första 12 månaderna", "Ingen bindningstid", "Spotpris + 0 kr påslag"]',
  '/logos/cheap-energy.png',
  'https://cheapenergy.se',
  '08-123 45 67',
  datetime('now'),
  datetime('now')
);

-- Steg 3: Lägg till Green Power
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, is_active, features, logo_url, website_url, 
  phone_number, created_at, updated_at
) VALUES (
  'green-power-2',
  'Green Power',
  'Miljövänlig el med 100% förnybar energi',
  29,
  0.52,
  0,
  24,
  1,
  '["100% förnybar energi", "Låg månadskostnad", "Miljöcertifierat", "24 månaders bindningstid"]',
  '/logos/green-power.png',
  'https://greenpower.se',
  '08-234 56 78',
  datetime('now'),
  datetime('now')
);

-- Steg 4: Lägg till Eco Power
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, is_active, features, logo_url, website_url, 
  phone_number, created_at, updated_at
) VALUES (
  'eco-power-3',
  'Eco Power',
  'Hållbar el med transparenta priser',
  19,
  0.48,
  6,
  18,
  1,
  '["Hållbar el", "Transparenta priser", "6 månader gratis", "18 månaders bindningstid"]',
  '/logos/eco-power.png',
  'https://ecopower.se',
  '08-345 67 89',
  datetime('now'),
  datetime('now')
);

-- Steg 5: Verifiera att data är inlagd
SELECT id, name, monthly_fee, energy_price, free_months, is_active 
FROM electricity_providers 
ORDER BY energy_price ASC;
