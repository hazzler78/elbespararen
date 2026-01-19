-- Migration 0037: Add password hash to users table
-- Lägger till lösenordshash för email/lösenord-autentisering

ALTER TABLE users ADD COLUMN password_hash TEXT; -- Hashat lösenord (för email/lösenord-inloggning)

-- Index för snabb sökning på email (redan finns, men behövs för inloggning)
