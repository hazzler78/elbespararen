-- Comprehensive fix for JSON and encoding issues
-- This migration fixes both JSON corruption and encoding problems

-- 1. Fix JSON corruption in avtalsalternativ
UPDATE electricity_providers 
SET avtalsalternativ = '[]' 
WHERE avtalsalternativ IS NOT NULL 
AND (avtalsalternativ LIKE '@{%' OR avtalsalternativ LIKE '%@{%');

-- 2. Fix encoding issues in contract_type
UPDATE electricity_providers 
SET contract_type = 'rörligt' 
WHERE contract_type = 'rÃ¶rligt';

UPDATE electricity_providers 
SET contract_type = 'fastpris' 
WHERE contract_type = 'fastpris';

-- 3. Fix encoding issues in descriptions
UPDATE electricity_providers 
SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description,
    'lÃ¥ga', 'låga'),
    'mÃ¥nader', 'månader'),
    'mÃ¥nadskostnad', 'månadskostnad'),
    'tillgÃ¤ngliga', 'tillgängliga'),
    'fÃ¶rsta', 'första'),
    'fÃ¶rnybar', 'förnybar'),
    'MiljÃ¶vÃ¤nlig', 'Miljövänlig'),
    'MiljÃ¶certifierat', 'Miljöcertifierat'),
    'mÃ¥naders', 'månaders'),
    'pÃ¥slag', 'påslag')
WHERE description LIKE '%Ã%';

-- 4. Fix encoding issues in features (if stored as string instead of JSON)
UPDATE electricity_providers 
SET features = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    features,
    'lÃ¥ga', 'låga'),
    'mÃ¥nader', 'månader'),
    'mÃ¥nadskostnad', 'månadskostnad'),
    'tillgÃ¤ngliga', 'tillgängliga'),
    'fÃ¶rsta', 'första'),
    'fÃ¶rnybar', 'förnybar'),
    'MiljÃ¶vÃ¤nlig', 'Miljövänlig'),
    'MiljÃ¶certifierat', 'Miljöcertifierat'),
    'mÃ¥naders', 'månaders'),
    'pÃ¥slag', 'påslag')
WHERE features LIKE '%Ã%';

-- 5. Ensure features is proper JSON array
UPDATE electricity_providers 
SET features = '["0 kr månadskostnad", "0 kr de första 12 månaderna", "Ingen bindningstid", "Spotpris + 0 kr påslag"]'
WHERE id = 'cheap-energy-1';

UPDATE electricity_providers 
SET features = '["100% förnybar energi", "Låg månadskostnad", "Miljöcertifierat", "24 månaders bindningstid"]'
WHERE id = 'green-power-2';
