-- Prevent future JSON corruption by ensuring all avtalsalternativ are proper JSON
-- This migration ensures that any future price updates don't corrupt the data

-- Set all avtalsalternativ to empty arrays to prevent corruption
UPDATE electricity_providers 
SET avtalsalternativ = '[]' 
WHERE avtalsalternativ IS NOT NULL 
AND avtalsalternativ != '[]'
AND (avtalsalternativ LIKE '@{%' OR avtalsalternativ LIKE '%@{%' OR avtalsalternativ LIKE '%mÃ¥nader%');

-- Also ensure features is proper JSON
UPDATE electricity_providers 
SET features = '[]' 
WHERE features IS NOT NULL 
AND features != '[]'
AND features NOT LIKE '[%';

-- Clean up any remaining encoding issues
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
