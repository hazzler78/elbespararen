-- Safe seed data - only adds data if table is empty
-- This migration safely adds sample providers without deleting existing data

-- Insert sample providers only if the table is empty
INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, contract_type, is_active, user_hidden, features, 
  logo_url, website_url, phone_number, avtalsalternativ, created_at, updated_at
) 
SELECT 
  'cheap-energy-1',
  'Cheap Energy',
  'Billigaste alternativet med 0 kr i månadskostnad och 0 kr de första 12 månaderna',
  0,
  0.45,
  12,
  12,
  'rörligt',
  1,
  0,
  '["0 kr månadskostnad", "0 kr de första 12 månaderna", "Ingen bindningstid", "Spotpris + 0 kr påslag"]',
  '/logos/cheap-energy.svg',
  'https://cheapenergy.se',
  '08-123 45 67',
  '[]',
  datetime('now'),
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM electricity_providers WHERE id = 'cheap-energy-1');

INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, contract_type, is_active, user_hidden, features, 
  logo_url, website_url, phone_number, avtalsalternativ, created_at, updated_at
) 
SELECT 
  'green-power-2',
  'Green Power',
  'Miljövänlig el med 100% förnybar energi',
  29,
  0.52,
  0,
  24,
  'rörligt',
  1,
  0,
  '["100% förnybar energi", "Låg månadskostnad", "Miljöcertifierat", "24 månaders bindningstid"]',
  '/logos/greenely.svg',
  'https://greenpower.se',
  '08-234 56 78',
  '[]',
  datetime('now'),
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM electricity_providers WHERE id = 'green-power-2');

INSERT INTO electricity_providers (
  id, name, description, monthly_fee, energy_price, free_months, 
  contract_length, contract_type, is_active, user_hidden, features, 
  logo_url, website_url, phone_number, avtalsalternativ, created_at, updated_at
) 
SELECT 
  'eco-power-3',
  'Eco Power',
  'Hållbar el med fokus på miljö och låga priser',
  19,
  0.48,
  6,
  18,
  'rörligt',
  1,
  0,
  '["Miljövänlig", "6 månader gratis", "18 månaders bindningstid", "Låg månadskostnad"]',
  '/logos/svekraft.svg',
  'https://ecopower.se',
  '08-345 67 89',
  '[]',
  datetime('now'),
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM electricity_providers WHERE id = 'eco-power-3');
