-- Normalize provider names to canonical values without altering schema or deleting rows
-- This script ONLY updates the `name` column based on known aliases.

-- Preview (optional): uncomment to see which rows will change
-- SELECT id, name FROM electricity_providers WHERE LOWER(name) IN (
--   'motala', 'motala el', 'svealands el', 'svealands elbolag', 'svealands elbolag ab', 'stockholms el'
-- );

UPDATE electricity_providers
SET name = CASE LOWER(name)
  WHEN 'motala' THEN 'Motala Energi'
  WHEN 'motala el' THEN 'Motala Energi'
  WHEN 'svealands el' THEN 'Svealands Elbolag'
  WHEN 'svealands elbolag' THEN 'Svealands Elbolag'
  WHEN 'svealands elbolag ab' THEN 'Svealands Elbolag'
  WHEN 'stockholms el' THEN 'Stockholms Elbolag'
  ELSE name
END
WHERE LOWER(name) IN (
  'motala', 'motala el', 'svealands el', 'svealands elbolag', 'svealands elbolag ab', 'stockholms el'
);

-- Verify result (optional)
-- SELECT id, name FROM electricity_providers WHERE name IN (
--   'Motala Energi', 'Svealands Elbolag', 'Stockholms Elbolag'
-- );


