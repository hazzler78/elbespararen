-- SQL Query för att kontrollera premium-användare i Cloudflare D1 Database
-- Kör denna query i Cloudflare Dashboard → D1 → SQL Editor

-- Visa alla användare med premium-status
SELECT 
  id,
  email,
  name,
  subscription_tier,
  subscription_status,
  subscription_started_at,
  subscription_expires_at,
  subscription_stripe_id,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC;

-- Räkna premium vs gratis användare
SELECT 
  subscription_tier,
  COUNT(*) as count
FROM users
GROUP BY subscription_tier;

-- Visa endast premium-användare
SELECT 
  email,
  name,
  subscription_tier,
  subscription_status,
  subscription_started_at,
  subscription_expires_at
FROM users
WHERE subscription_tier = 'premium'
ORDER BY subscription_started_at DESC;

-- Kontrollera om subscription_tier kolumnen finns och har värden
SELECT 
  COUNT(*) as total_users,
  COUNT(subscription_tier) as users_with_tier,
  COUNT(CASE WHEN subscription_tier = 'premium' THEN 1 END) as premium_users,
  COUNT(CASE WHEN subscription_tier = 'free' THEN 1 END) as free_users,
  COUNT(CASE WHEN subscription_tier IS NULL THEN 1 END) as null_tier
FROM users;
