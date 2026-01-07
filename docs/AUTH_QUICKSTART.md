# 🚀 Snabbstart: Google Authentication

## Vad har implementerats?

✅ Google OAuth med NextAuth.js  
✅ Users-tabell i databasen  
✅ Koppling mellan fakturaanalyser och användare  
✅ Dashboard med användardata  
✅ Login/logout-komponenter  

## Snabb setup (5 minuter)

### 1. Installera dependencies
```bash
npm install
```

### 2. Konfigurera Google OAuth

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa OAuth Client ID (se `docs/GOOGLE_AUTH_SETUP.md` för detaljer)
3. Lägg till i `.env.local`:
```env
GOOGLE_CLIENT_ID=ditt_client_id
GOOGLE_CLIENT_SECRET=ditt_client_secret
NEXTAUTH_SECRET=generera_med_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

### 3. Kör migrations
```bash
wrangler d1 migrations apply elbespararen-db
```

### 4. Testa
```bash
npm run dev
```

Gå till `/dashboard` eller `/auth/signin` och logga in med Google!

## Funktioner

- **Enkel inloggning**: Ett klick med Google
- **Automatisk användarskapande**: Skapas vid första inloggning
- **Koppling av fakturor**: Nya fakturaanalyser kopplas automatiskt till ditt konto
- **Dashboard**: Se alla dina analyser på ett ställe
- **Statistik**: Totalt sparat, trender, benchmarking

## API Endpoints

- `GET /api/user/bill-analyses?range=year` - Hämta dina fakturaanalyser
- `GET /api/user/stats` - Hämta din statistik
- `POST /api/auth/signin` - Logga in
- `POST /api/auth/signout` - Logga ut

## Nästa steg

1. Konfigurera Google OAuth credentials
2. Kör migrations
3. Testa inloggning
4. Ladda upp en faktura och se att den kopplas till ditt konto
5. Gå till dashboard och se dina analyser!
