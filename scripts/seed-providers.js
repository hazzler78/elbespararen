// Seed script för att lägga till leverantörsdata i D1-databasen
// Kör med: npx wrangler d1 execute elbespararen-db --file=scripts/seed-providers.js

// Ta bort befintlig data först
DELETE FROM electricity_providers;

// Lägg till Cheap Energy
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
  true,
  '["0 kr månadskostnad", "0 kr de första 12 månaderna", "Ingen bindningstid", "Spotpris + 0 kr påslag"]',
  '/logos/cheap-energy.png',
  'https://cheapenergy.se',
  '08-123 45 67',
  datetime('now'),
  datetime('now')
);

-- Lägg till Green Power
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
  true,
  '["100% förnybar energi", "Låg månadskostnad", "Miljöcertifierat", "24 månaders bindningstid"]',
  '/logos/green-power.png',
  'https://greenpower.se',
  '08-234 56 78',
  datetime('now'),
  datetime('now')
);

-- Kontrollera att data är inlagd
SELECT * FROM electricity_providers;
