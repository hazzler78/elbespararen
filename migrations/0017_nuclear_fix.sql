-- Nuclear fix - completely clean all JSON data
-- This migration ensures all JSON fields are properly formatted

-- 1. Set all avtalsalternativ to empty arrays
UPDATE electricity_providers 
SET avtalsalternativ = '[]';

-- 2. Set all features to simple arrays
UPDATE electricity_providers 
SET features = '["Fastpris"]'
WHERE contract_type = 'fastpris';

UPDATE electricity_providers 
SET features = '["Rörligt"]'
WHERE contract_type = 'rörligt';

-- 3. Fix any remaining encoding issues in descriptions
UPDATE electricity_providers 
SET description = 'Billig el'
WHERE description LIKE '%Ã%';

-- 4. Ensure contract_type is correct
UPDATE electricity_providers 
SET contract_type = 'rörligt' 
WHERE contract_type = 'rÃ¶rligt';

UPDATE electricity_providers 
SET contract_type = 'fastpris' 
WHERE contract_type = 'fastpris';
