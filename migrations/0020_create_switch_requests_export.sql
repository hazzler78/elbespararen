-- Migration 0020: Create normalized export table for switch requests
-- This table mirrors the current CSV structure and is kept in sync via triggers

PRAGMA foreign_keys = ON;

-- Create export table
CREATE TABLE IF NOT EXISTS switch_requests_export (
  id TEXT PRIMARY KEY, -- same as switch_requests.id
  avtalspris REAL,
  avtalsform TEXT,
  bindning INTEGER,
  manadsavgift REAL,
  paslag REAL,
  elcertifikat TEXT,
  rabatt TEXT,
  total REAL,
  elursprung TEXT,
  forbrukning INTEGER,
  betalsatt TEXT,
  namn1 TEXT,
  namn2 TEXT,
  kundtyp TEXT,
  person_orgnummer TEXT,
  personnrtyp TEXT,
  anl_adress TEXT,
  anl_postnr TEXT,
  anl_ort TEXT,
  kundadress TEXT,
  kundpostnr TEXT,
  kundort TEXT,
  kundland TEXT,
  telefon1 TEXT,
  telefon2 TEXT,
  epost TEXT,
  anlaggningsnr TEXT,
  omrades_id TEXT,
  leveransdatum TEXT,
  importtyp TEXT,
  avtals_id TEXT,
  fullmakt_fornamn TEXT,
  fullmakt_efternamn TEXT,
  fullmakt_personnr TEXT,
  orderdatum TEXT,
  order_id TEXT,
  agentnamn TEXT,
  ljudfilsnamn TEXT,
  ljudkontrollant TEXT,
  saljar_id TEXT,
  kontors_id TEXT,
  debiteringsgrupp TEXT,
  andel_reducerad_energiskatt TEXT
);

-- Helper view expression as inline SQL for computing export row from switch_requests
-- We will use JSON1 functions to extract and compute values

-- Backfill existing rows
INSERT OR REPLACE INTO switch_requests_export (
  id, avtalspris, avtalsform, bindning, manadsavgift, paslag, elcertifikat, rabatt,
  total, elursprung, forbrukning, betalsatt, namn1, namn2, kundtyp, person_orgnummer,
  personnrtyp, anl_adress, anl_postnr, anl_ort, kundadress, kundpostnr, kundort, kundland,
  telefon1, telefon2, epost, anlaggningsnr, omrades_id, leveransdatum, importtyp,
  avtals_id, fullmakt_fornamn, fullmakt_efternamn, fullmakt_personnr, orderdatum, order_id,
  agentnamn, ljudfilsnamn, ljudkontrollant, saljar_id, kontors_id, debiteringsgrupp,
  andel_reducerad_energiskatt
)
SELECT
  sr.id,
  CASE WHEN json_extract(sr.new_provider,'$.contractType') = 'fastpris'
       THEN CAST(json_extract(sr.new_provider,'$.energyPrice') AS REAL)
       ELSE COALESCE(CAST(json_extract(sr.new_provider,'$.energyPrice') AS REAL), 0)
  END AS avtalspris,
  CASE WHEN json_extract(sr.new_provider,'$.contractType') = 'fastpris' THEN 'fastavtal' ELSE 'rörligt' END AS avtalsform,
  CAST(json_extract(sr.new_provider,'$.contractLength') AS INTEGER) AS bindning,
  CAST(json_extract(sr.new_provider,'$.monthlyFee') AS REAL) AS manadsavgift,
  CASE WHEN json_extract(sr.new_provider,'$.contractType') = 'rörligt'
       THEN COALESCE(CAST(json_extract(sr.new_provider,'$.energyPrice') AS REAL), 0)
       ELSE NULL END AS paslag,
  NULL AS elcertifikat,
  CASE WHEN CAST(json_extract(sr.new_provider,'$.freeMonths') AS INTEGER) > 0
       THEN CAST(json_extract(sr.new_provider,'$.freeMonths') AS TEXT) || ' fria mån' ELSE NULL END AS rabatt,
  (COALESCE(CAST(json_extract(sr.new_provider,'$.monthlyFee') AS REAL),0)
    + (
      (CASE WHEN json_extract(sr.new_provider,'$.contractType') = 'fastpris'
            THEN COALESCE(CAST(json_extract(sr.new_provider,'$.energyPrice') AS REAL),0)
            ELSE COALESCE(CAST(json_extract(sr.new_provider,'$.energyPrice') AS REAL),0)
       END)
      * COALESCE(CAST(json_extract(sr.bill_data,'$.totalKWh') AS REAL),0)
    )
  ) AS total,
  'NordenMix' AS elursprung,
  CAST(json_extract(sr.bill_data,'$.totalKWh') AS INTEGER) AS forbrukning,
  json_extract(sr.customer_info,'$.paymentMethod') AS betalsatt,
  json_extract(sr.customer_info,'$.firstName') || ' ' || json_extract(sr.customer_info,'$.lastName') AS namn1,
  NULL AS namn2,
  'K' AS kundtyp,
  json_extract(sr.customer_info,'$.personalNumber') AS person_orgnummer,
  CASE WHEN json_extract(sr.customer_info,'$.personalNumber') IS NOT NULL AND json_extract(sr.customer_info,'$.personalNumber') != '' THEN 'S' ELSE NULL END AS personnrtyp,
  json_extract(sr.address,'$.street') || ' ' || json_extract(sr.address,'$.streetNumber') ||
    CASE WHEN json_extract(sr.address,'$.apartment') IS NOT NULL AND json_extract(sr.address,'$.apartment') != ''
         THEN ', ' || json_extract(sr.address,'$.apartment') ELSE '' END AS anl_adress,
  json_extract(sr.address,'$.postalCode') AS anl_postnr,
  json_extract(sr.address,'$.city') AS anl_ort,
  json_extract(sr.address,'$.street') || ' ' || json_extract(sr.address,'$.streetNumber') ||
    CASE WHEN json_extract(sr.address,'$.apartment') IS NOT NULL AND json_extract(sr.address,'$.apartment') != ''
         THEN ', ' || json_extract(sr.address,'$.apartment') ELSE '' END AS kundadress,
  json_extract(sr.address,'$.postalCode') AS kundpostnr,
  json_extract(sr.address,'$.city') AS kundort,
  'SE' AS kundland,
  json_extract(sr.customer_info,'$.phone') AS telefon1,
  NULL AS telefon2,
  json_extract(sr.customer_info,'$.email') AS epost,
  json_extract(sr.current_provider,'$.customerNumber') AS anlaggningsnr,
  NULL AS omrades_id,
  NULL AS leveransdatum,
  '0' AS importtyp,
  sr.id AS avtals_id,
  json_extract(sr.customer_info,'$.firstName') AS fullmakt_fornamn,
  json_extract(sr.customer_info,'$.lastName') AS fullmakt_efternamn,
  json_extract(sr.customer_info,'$.personalNumber') AS fullmakt_personnr,
  DATE(sr.created_at) AS orderdatum,
  sr.id AS order_id,
  json_extract(sr.new_provider,'$.name') AS agentnamn,
  NULL AS ljudfilsnamn,
  NULL AS ljudkontrollant,
  NULL AS saljar_id,
  NULL AS kontors_id,
  'Elchef.se' AS debiteringsgrupp,
  NULL AS andel_reducerad_energiskatt
FROM switch_requests sr;

-- Trigger: keep export table in sync on INSERT
DROP TRIGGER IF EXISTS trg_switch_requests_export_insert;
CREATE TRIGGER IF NOT EXISTS trg_switch_requests_export_insert
AFTER INSERT ON switch_requests
BEGIN
  INSERT OR REPLACE INTO switch_requests_export (
    id, avtalspris, avtalsform, bindning, manadsavgift, paslag, elcertifikat, rabatt,
    total, elursprung, forbrukning, betalsatt, namn1, namn2, kundtyp, person_orgnummer,
    personnrtyp, anl_adress, anl_postnr, anl_ort, kundadress, kundpostnr, kundort, kundland,
    telefon1, telefon2, epost, anlaggningsnr, omrades_id, leveransdatum, importtyp,
    avtals_id, fullmakt_fornamn, fullmakt_efternamn, fullmakt_personnr, orderdatum, order_id,
    agentnamn, ljudfilsnamn, ljudkontrollant, saljar_id, kontors_id, debiteringsgrupp,
    andel_reducerad_energiskatt
  )
  SELECT
    NEW.id,
    CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'fastpris'
         THEN CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL)
         ELSE COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL), 0)
    END,
    CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'fastpris' THEN 'fastavtal' ELSE 'rörligt' END,
    CAST(json_extract(NEW.new_provider,'$.contractLength') AS INTEGER),
    CAST(json_extract(NEW.new_provider,'$.monthlyFee') AS REAL),
    CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'rörligt'
         THEN COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL), 0)
         ELSE NULL END,
    NULL,
    CASE WHEN CAST(json_extract(NEW.new_provider,'$.freeMonths') AS INTEGER) > 0
         THEN CAST(json_extract(NEW.new_provider,'$.freeMonths') AS TEXT) || ' fria mån' ELSE NULL END,
    (COALESCE(CAST(json_extract(NEW.new_provider,'$.monthlyFee') AS REAL),0)
      + ((CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'fastpris'
               THEN COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL),0)
               ELSE COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL),0)
         END) * COALESCE(CAST(json_extract(NEW.bill_data,'$.totalKWh') AS REAL),0)
      )
    ),
    'NordenMix',
    CAST(json_extract(NEW.bill_data,'$.totalKWh') AS INTEGER),
    json_extract(NEW.customer_info,'$.paymentMethod'),
    json_extract(NEW.customer_info,'$.firstName') || ' ' || json_extract(NEW.customer_info,'$.lastName'),
    NULL,
    'K',
    json_extract(NEW.customer_info,'$.personalNumber'),
    CASE WHEN json_extract(NEW.customer_info,'$.personalNumber') IS NOT NULL AND json_extract(NEW.customer_info,'$.personalNumber') != '' THEN 'S' ELSE NULL END,
    json_extract(NEW.address,'$.street') || ' ' || json_extract(NEW.address,'$.streetNumber') ||
      CASE WHEN json_extract(NEW.address,'$.apartment') IS NOT NULL AND json_extract(NEW.address,'$.apartment') != ''
           THEN ', ' || json_extract(NEW.address,'$.apartment') ELSE '' END,
    json_extract(NEW.address,'$.postalCode'),
    json_extract(NEW.address,'$.city'),
    json_extract(NEW.address,'$.street') || ' ' || json_extract(NEW.address,'$.streetNumber') ||
      CASE WHEN json_extract(NEW.address,'$.apartment') IS NOT NULL AND json_extract(NEW.address,'$.apartment') != ''
           THEN ', ' || json_extract(NEW.address,'$.apartment') ELSE '' END,
    json_extract(NEW.address,'$.postalCode'),
    json_extract(NEW.address,'$.city'),
    'SE',
    json_extract(NEW.customer_info,'$.phone'),
    NULL,
    json_extract(NEW.customer_info,'$.email'),
    json_extract(NEW.current_provider,'$.customerNumber'),
    NULL,
    NULL,
    '0',
    NEW.id,
    json_extract(NEW.customer_info,'$.firstName'),
    json_extract(NEW.customer_info,'$.lastName'),
    json_extract(NEW.customer_info,'$.personalNumber'),
    DATE(NEW.created_at),
    NEW.id,
    json_extract(NEW.new_provider,'$.name'),
    NULL,
    NULL,
    NULL,
    NULL,
    'Elchef.se',
    NULL;
END;

-- Trigger: keep export table in sync on UPDATE
DROP TRIGGER IF EXISTS trg_switch_requests_export_update;
CREATE TRIGGER IF NOT EXISTS trg_switch_requests_export_update
AFTER UPDATE ON switch_requests
BEGIN
  INSERT OR REPLACE INTO switch_requests_export (
    id, avtalspris, avtalsform, bindning, manadsavgift, paslag, elcertifikat, rabatt,
    total, elursprung, forbrukning, betalsatt, namn1, namn2, kundtyp, person_orgnummer,
    personnrtyp, anl_adress, anl_postnr, anl_ort, kundadress, kundpostnr, kundort, kundland,
    telefon1, telefon2, epost, anlaggningsnr, omrades_id, leveransdatum, importtyp,
    avtals_id, fullmakt_fornamn, fullmakt_efternamn, fullmakt_personnr, orderdatum, order_id,
    agentnamn, ljudfilsnamn, ljudkontrollant, saljar_id, kontors_id, debiteringsgrupp,
    andel_reducerad_energiskatt
  )
  SELECT
    NEW.id,
    CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'fastpris'
         THEN CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL)
         ELSE COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL), 0)
    END,
    CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'fastpris' THEN 'fastavtal' ELSE 'rörligt' END,
    CAST(json_extract(NEW.new_provider,'$.contractLength') AS INTEGER),
    CAST(json_extract(NEW.new_provider,'$.monthlyFee') AS REAL),
    CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'rörligt'
         THEN COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL), 0)
         ELSE NULL END,
    NULL,
    CASE WHEN CAST(json_extract(NEW.new_provider,'$.freeMonths') AS INTEGER) > 0
         THEN CAST(json_extract(NEW.new_provider,'$.freeMonths') AS TEXT) || ' fria mån' ELSE NULL END,
    (COALESCE(CAST(json_extract(NEW.new_provider,'$.monthlyFee') AS REAL),0)
      + ((CASE WHEN json_extract(NEW.new_provider,'$.contractType') = 'fastpris'
               THEN COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL),0)
               ELSE COALESCE(CAST(json_extract(NEW.new_provider,'$.energyPrice') AS REAL),0)
         END) * COALESCE(CAST(json_extract(NEW.bill_data,'$.totalKWh') AS REAL),0)
      )
    ),
    'NordenMix',
    CAST(json_extract(NEW.bill_data,'$.totalKWh') AS INTEGER),
    json_extract(NEW.customer_info,'$.paymentMethod'),
    json_extract(NEW.customer_info,'$.firstName') || ' ' || json_extract(NEW.customer_info,'$.lastName'),
    NULL,
    'K',
    json_extract(NEW.customer_info,'$.personalNumber'),
    CASE WHEN json_extract(NEW.customer_info,'$.personalNumber') IS NOT NULL AND json_extract(NEW.customer_info,'$.personalNumber') != '' THEN 'S' ELSE NULL END,
    json_extract(NEW.address,'$.street') || ' ' || json_extract(NEW.address,'$.streetNumber') ||
      CASE WHEN json_extract(NEW.address,'$.apartment') IS NOT NULL AND json_extract(NEW.address,'$.apartment') != ''
           THEN ', ' || json_extract(NEW.address,'$.apartment') ELSE '' END,
    json_extract(NEW.address,'$.postalCode'),
    json_extract(NEW.address,'$.city'),
    json_extract(NEW.address,'$.street') || ' ' || json_extract(NEW.address,'$.streetNumber') ||
      CASE WHEN json_extract(NEW.address,'$.apartment') IS NOT NULL AND json_extract(NEW.address,'$.apartment') != ''
           THEN ', ' || json_extract(NEW.address,'$.apartment') ELSE '' END,
    json_extract(NEW.address,'$.postalCode'),
    json_extract(NEW.address,'$.city'),
    'SE',
    json_extract(NEW.customer_info,'$.phone'),
    NULL,
    json_extract(NEW.customer_info,'$.email'),
    json_extract(NEW.current_provider,'$.customerNumber'),
    NULL,
    NULL,
    '0',
    NEW.id,
    json_extract(NEW.customer_info,'$.firstName'),
    json_extract(NEW.customer_info,'$.lastName'),
    json_extract(NEW.customer_info,'$.personalNumber'),
    DATE(NEW.created_at),
    NEW.id,
    json_extract(NEW.new_provider,'$.name'),
    NULL,
    NULL,
    NULL,
    NULL,
    'Elchef.se',
    NULL;
END;


