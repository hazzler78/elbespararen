// Setup script för att lägga till leverantörsdata i D1-databasen
// Kör med: npx wrangler d1 execute elbespararen-db --file=scripts/setup-providers.js

console.log('Setting up electricity providers in D1 database...');

// Ta bort befintlig data först
console.log('Clearing existing data...');
DELETE FROM electricity_providers;

// Lägg till Cheap Energy
console.log('Adding Cheap Energy...');
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
console.log('Adding Green Power...');
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

-- Lägg till ytterligare en leverantör för mer variation
console.log('Adding Eco Power...');
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
  true,
  '["Hållbar el", "Transparenta priser", "6 månader gratis", "18 månaders bindningstid"]',
  '/logos/eco-power.png',
  'https://ecopower.se',
  '08-345 67 89',
  datetime('now'),
  datetime('now')
);

-- Kontrollera att data är inlagd
console.log('Verifying data...');
SELECT 
  id, 
  name, 
  monthly_fee, 
  energy_price, 
  free_months,
  is_active 
FROM electricity_providers 
ORDER BY energy_price ASC;

console.log('Setup complete!');
