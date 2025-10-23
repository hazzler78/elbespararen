-- Emergency fix for JSON corruption
-- This migration completely cleans up all corrupted data

-- 1. Set all avtalsalternativ to empty arrays
UPDATE electricity_providers 
SET avtalsalternativ = '[]';

-- 2. Set all features to basic arrays
UPDATE electricity_providers 
SET features = '["Fastpris", "Flera avtalsalternativ"]'
WHERE contract_type = 'fastpris';

UPDATE electricity_providers 
SET features = '["Rörligt pris", "Ingen bindningstid"]'
WHERE contract_type = 'rörligt';

-- 3. Fix any remaining encoding issues
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

-- 4. Ensure contract_type is correct
UPDATE electricity_providers 
SET contract_type = 'rörligt' 
WHERE contract_type = 'rÃ¶rligt';

UPDATE electricity_providers 
SET contract_type = 'fastpris' 
WHERE contract_type = 'fastpris';
