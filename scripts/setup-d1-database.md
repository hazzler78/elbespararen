# Setup D1 Database för Elbespararen

## Steg 1: Skapa D1-databas via Cloudflare Dashboard

1. Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Välj ditt konto
3. Gå till "Workers & Pages" → "D1 SQL Database"
4. Klicka "Create database"
5. Namnge databasen: `elbespararen-db`
6. Välj din region (föredraget: närmast Sverige)
7. Klicka "Create"

## Steg 2: Uppdatera wrangler.toml

Efter att databasen är skapad:
1. Kopiera Database ID från Cloudflare Dashboard
2. Uppdatera `database_id` i `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "elbespararen-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Ersätt med ditt Database ID
migrations_dir = "src/lib/database/migrations"
```

## Steg 3: Kör migrations

```bash
npx wrangler d1 migrations apply elbespararen-db
```

## Steg 4: Seed provider-data

```bash
npx wrangler d1 execute elbespararen-db --file=scripts/seed-providers.js
```

## Steg 5: Verifiera data

```bash
npx wrangler d1 execute elbespararen-db --command="SELECT * FROM electricity_providers;"
```

## Alternativ: Använd Wrangler för att skapa databas

Om du har rätt behörigheter:

```bash
npx wrangler d1 create elbespararen-db
```

Detta kommer att skapa databasen och visa Database ID som du kan kopiera till wrangler.toml.
