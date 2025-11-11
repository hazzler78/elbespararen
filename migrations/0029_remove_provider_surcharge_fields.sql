-- Remove surcharge-related columns from electricity_providers
ALTER TABLE electricity_providers
  DROP COLUMN surcharge;

ALTER TABLE electricity_providers
  DROP COLUMN el_certificate_fee;

ALTER TABLE electricity_providers
  DROP COLUMN twelve_month_discount;


