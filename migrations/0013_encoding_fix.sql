-- Specific encoding fix for Swedish characters
-- This migration fixes the remaining encoding issues

-- Fix contract_type encoding
UPDATE electricity_providers 
SET contract_type = 'rörligt' 
WHERE contract_type = 'rÃ¶rligt';

UPDATE electricity_providers 
SET contract_type = 'fastpris' 
WHERE contract_type = 'fastpris';

-- Fix description encoding
UPDATE electricity_providers 
SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
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
    'pÃ¥slag', 'påslag'),
    'rÃ¶rligt', 'rörligt'),
    'fastpris', 'fastpris'),
    'Billig', 'Billig'),
    'Test test', 'Test test'),
    'Stockholms El fastpris', 'Stockholms El fastpris'),
    'Svealands EL fastpris', 'Svealands EL fastpris'),
    'Energi2 fastpris - flera avtalsalternativ tillgÃ¤ngliga', 'Energi2 fastpris - flera avtalsalternativ tillgängliga'),
    'Motala El fastpris', 'Motala El fastpris'),
    'Billigaste alternativet med lÃ¥ga fastpriser', 'Billigaste alternativet med låga fastpriser'),
    'Svekraft fastpris', 'Svekraft fastpris')
WHERE description LIKE '%Ã%' OR description LIKE '%Ã¤%' OR description LIKE '%Ã¶%';

-- Fix features encoding
UPDATE electricity_providers 
SET features = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
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
    'pÃ¥slag', 'påslag'),
    'rÃ¶rligt', 'rörligt'),
    'fastpris', 'fastpris'),
    'Billig', 'Billig'),
    'Test test', 'Test test'),
    'Stockholms El fastpris', 'Stockholms El fastpris'),
    'Svealands EL fastpris', 'Svealands EL fastpris'),
    'Energi2 fastpris - flera avtalsalternativ tillgÃ¤ngliga', 'Energi2 fastpris - flera avtalsalternativ tillgängliga'),
    'Motala El fastpris', 'Motala El fastpris'),
    'Billigaste alternativet med lÃ¥ga fastpriser', 'Billigaste alternativet med låga fastpriser'),
    'Svekraft fastpris', 'Svekraft fastpris')
WHERE features LIKE '%Ã%' OR features LIKE '%Ã¤%' OR features LIKE '%Ã¶%';
