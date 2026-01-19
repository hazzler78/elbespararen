-- Migration 0036: Add premium subscription to users table
-- Lägger till premium/subscription-kolumner för användare

ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired'));
ALTER TABLE users ADD COLUMN subscription_started_at TEXT;
ALTER TABLE users ADD COLUMN subscription_expires_at TEXT;
ALTER TABLE users ADD COLUMN subscription_stripe_id TEXT; -- Stripe subscription ID för framtida betalningsintegration

-- Index för snabb sökning på premium-användare
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
