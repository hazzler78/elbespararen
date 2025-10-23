# 🚨 URGENT: Production Database Fix

## Problem
The production database has corrupted JSON data in the `avtalsalternativ` column, causing 500 errors and JSON parsing failures in the frontend.

## Root Cause
- `avtalsalternativ` data was saved as PowerShell objects (`@{namn=...}`) instead of proper JSON
- Swedish characters are incorrectly encoded (`rÃ¶rligt` instead of `rörligt`)

## Solution
Run these SQL commands in the Cloudflare D1 Console:

### Step 1: Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → D1 SQL Database → elbespararen-db
3. Click **Console** tab

### Step 2: Run Fix Commands

```sql
-- 1. Fix JSON corruption in avtalsalternativ
UPDATE electricity_providers 
SET avtalsalternativ = '[]' 
WHERE avtalsalternativ IS NOT NULL 
AND (avtalsalternativ LIKE '@{%' OR avtalsalternativ LIKE '%@{%');

-- 2. Fix encoding issues in contract_type
UPDATE electricity_providers 
SET contract_type = 'rörligt' 
WHERE contract_type = 'rÃ¶rligt';

UPDATE electricity_providers 
SET contract_type = 'fastpris' 
WHERE contract_type = 'fastpris';

-- 3. Fix encoding issues in descriptions
UPDATE electricity_providers 
SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
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
    'pÃ¥slag', 'påslag')
WHERE description LIKE '%Ã%';

-- 4. Fix encoding issues in features
UPDATE electricity_providers 
SET features = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
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
    'pÃ¥slag', 'påslag')
WHERE features LIKE '%Ã%';
```

### Step 3: Verify Fix
After running the commands, test these URLs:
- `https://elbespararen.pages.dev/api/providers?includeHidden=true`
- `https://elbespararen.pages.dev/admin/providers`

Expected result:
- ✅ 200 OK status codes
- ✅ Valid JSON responses
- ✅ No more "Internal Server Error" messages
- ✅ Swedish characters display correctly

### Step 4: Check Results
Run this query to verify the fix:
```sql
SELECT id, name, contract_type, avtalsalternativ 
FROM electricity_providers 
LIMIT 5;
```

You should see:
- `contract_type` showing `rörligt` or `fastpris` (not `rÃ¶rligt`)
- `avtalsalternativ` showing `[]` or proper JSON (not `@{...}`)

## Expected Outcome
After this fix:
- ✅ API endpoints return 200 OK
- ✅ Admin panel loads without errors
- ✅ No more JSON parsing errors in browser console
- ✅ Swedish characters display correctly
- ✅ All providers are visible in the admin interface
