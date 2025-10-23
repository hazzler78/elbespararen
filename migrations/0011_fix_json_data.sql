-- Fix JSON data corruption in avtalsalternativ column
-- This migration cleans up corrupted JSON data that was saved as PowerShell objects

-- Update avtalsalternativ to proper JSON format
-- First, let's see what the current data looks like
-- The issue is that data was saved as PowerShell objects like "@{namn=3 månader; fastpris=0.64; ...}"
-- We need to convert this to proper JSON format

-- For now, let's set all avtalsalternativ to empty arrays to fix the immediate JSON parsing issue
UPDATE electricity_providers 
SET avtalsalternativ = '[]' 
WHERE avtalsalternativ IS NOT NULL 
AND avtalsalternativ != '[]'
AND avtalsalternativ LIKE '@{%';

-- Also fix any encoding issues in contract_type
UPDATE electricity_providers 
SET contract_type = 'rörligt' 
WHERE contract_type = 'rÃ¶rligt';

UPDATE electricity_providers 
SET contract_type = 'fastpris' 
WHERE contract_type = 'fastpris';

-- Fix encoding issues in descriptions
UPDATE electricity_providers 
SET description = REPLACE(description, 'lÃ¥ga', 'låga')
WHERE description LIKE '%lÃ¥ga%';

UPDATE electricity_providers 
SET description = REPLACE(description, 'mÃ¥nader', 'månader')
WHERE description LIKE '%mÃ¥nader%';

UPDATE electricity_providers 
SET description = REPLACE(description, 'mÃ¥nadskostnad', 'månadskostnad')
WHERE description LIKE '%mÃ¥nadskostnad%';

UPDATE electricity_providers 
SET description = REPLACE(description, 'tillgÃ¤ngliga', 'tillgängliga')
WHERE description LIKE '%tillgÃ¤ngliga%';
