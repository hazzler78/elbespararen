-- Update provider descriptions to canonical values
-- This script ONLY updates the description column based on provider names.

UPDATE electricity_providers
SET description = CASE name
  WHEN 'Motala Energi' THEN 'När du tecknar elavtal med Motala Energi får du därför el från förnybara energikällor som sol, vind och vatten.'
  WHEN 'Svekraft' THEN 'Det naturliga elvalet.'
  WHEN 'Energi2' THEN '100 % Nordisk el för både små och stora företag inom alla branscher.'
  WHEN 'Tibber' THEN 'If the best deal for your wallet also is the best deal for the planet – everybody wins.'
  WHEN 'Telinet Energi' THEN 'Alltid billigt. Alltid grönt. Alltid enkelt.'
  WHEN 'Fortum' THEN 'To power a world where people, businesses and nature thrive together.'
  WHEN 'Skellefteå Kraft' THEN 'We endeavour to be Sweden''s best energy company and consider ourselves the industry''s challenger.'
  WHEN 'Greenely' THEN 'Låt elen jobba för dig. På riktigt.'
  WHEN 'Bixia' THEN 'Kraft från naturen. Nära dig.'
  WHEN 'Dalakraft' THEN 'Bli del av något större.'
  WHEN 'Svealands Elbolag' THEN 'Fastprisgaranti på ert elavtal! Om ni hittar något billigare fastprisavtal på elmarknaden så prismatchar vi det och ger i tillägg 1 öre / kWh i extra rabatt'
  WHEN 'Stockholms Elbolag' THEN 'Stockholms Elbolag är här för att visa vägen till en trygg och miljövänlig framtid.'
  ELSE description
END
WHERE name IN (
  'Motala Energi', 'Svekraft', 'Energi2', 'Tibber', 'Telinet Energi', 
  'Fortum', 'Skellefteå Kraft', 'Greenely', 'Bixia', 'Dalakraft', 
  'Svealands Elbolag', 'Stockholms Elbolag'
);

-- Verify result (optional)
-- SELECT name, description FROM electricity_providers WHERE name IN (
--   'Motala Energi', 'Svekraft', 'Energi2', 'Tibber', 'Telinet Energi', 
--   'Fortum', 'Skellefteå Kraft', 'Greenely', 'Bixia', 'Dalakraft', 
--   'Svealands Elbolag', 'Stockholms Elbolag'
-- );
