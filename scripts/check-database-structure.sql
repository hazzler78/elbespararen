-- Kontrollera databasstrukturen
-- Kör dessa kommandon i Cloudflare Dashboard Console

-- 1. Lista alla tabeller
SELECT name FROM sqlite_master WHERE type='table';

-- 2. Visa struktur för electricity_providers tabellen
PRAGMA table_info(electricity_providers);

-- 3. Visa alla rader i electricity_providers
SELECT * FROM electricity_providers LIMIT 5;

-- 4. Räkna antal rader
SELECT COUNT(*) as total_rows FROM electricity_providers;
