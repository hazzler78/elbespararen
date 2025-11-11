-- Add surcharge-related columns to electricity_providers
ALTER TABLE electricity_providers
  ADD COLUMN surcharge REAL NOT NULL DEFAULT 0;

ALTER TABLE electricity_providers
  ADD COLUMN el_certificate_fee REAL NOT NULL DEFAULT 0;

ALTER TABLE electricity_providers
  ADD COLUMN twelve_month_discount REAL NOT NULL DEFAULT 0;


