# Supabase Auth Migration Guide

## Översikt

Vi har migrerat från NextAuth v5 beta till Supabase Auth för bättre Edge runtime-kompatibilitet med Cloudflare Pages.

## Vad som har ändrats

### 1. Paket
- ✅ Installerat `@supabase/ssr`
- ✅ Behållit `@supabase/supabase-js` (redan installerat)
- ⚠️ `next-auth` finns kvar men används inte längre (kan tas bort senare)

### 2. Nya filer
- `src/lib/supabase/client.ts` - Browser client för Supabase
- `src/lib/supabase/server.ts` - Server client för Supabase
- `src/lib/supabase/middleware.ts` - Middleware för session refresh
- `src/middleware.ts` - Next.js middleware
- `src/hooks/useAuth.ts` - Custom hook för auth state
- `src/app/api/auth/callback/route.ts` - OAuth callback handler
- `src/app/api/auth/signout/route.ts` - Sign out handler
- `src/app/api/auth/signin/google/route.ts` - Google sign in handler

### 3. Uppdaterade filer
- `src/app/auth/signin/page.tsx` - Använder Supabase Auth
- `src/components/AuthButton.tsx` - Använder Supabase Auth
- `src/components/Providers.tsx` - Tog bort SessionProvider
- `src/lib/auth.ts` - Uppdaterad för Supabase Auth
- `src/app/dashboard/page.tsx` - Uppdaterad för Supabase Auth
- `env.example` - Lagt till Supabase env vars

## Konfiguration som behövs

### 1. Supabase Setup

1. Gå till [Supabase Dashboard](https://app.supabase.com/)
2. Välj ditt projekt (eller skapa ett nytt)
3. Gå till **Settings** > **API**
4. Kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Google OAuth Setup i Supabase

1. Gå till **Authentication** > **Providers** i Supabase Dashboard
2. Aktivera **Google** provider
3. Lägg till:
   - **Client ID** (samma som du använder för NextAuth)
   - **Client Secret** (samma som du använder för NextAuth)
4. Lägg till **Redirect URL**:
   - `https://elbespararen.se/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (för utveckling)

### 3. Environment Variables

Lägg till i Cloudflare Pages environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Och i din lokala `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Sidor som behöver uppdateras

Följande sidor använder fortfarande `useSession` från NextAuth och behöver uppdateras:

- `src/app/admin/set-premium/page.tsx`
- `src/app/premium/page.tsx`
- `src/app/premium/success/page.tsx`
- `src/app/auth/register/page.tsx`
- `src/app/test-premium/page.tsx`

Uppdatera dessa genom att:
1. Ersätt `import { useSession } from "next-auth/react"` med `import { useAuth } from "@/hooks/useAuth"`
2. Ersätt `const { data: session, status } = useSession()` med `const { user, loading } = useAuth()`
3. Ersätt `session?.user` med `user`
4. Ersätt `status === "loading"` med `loading`
5. Ersätt `status === "authenticated"` med `!!user`
6. Ersätt `status === "unauthenticated"` med `!user`

## Testning

1. **Testa Google OAuth:**
   - Gå till `/auth/signin`
   - Klicka på "Fortsätt med Google"
   - Verifiera att du redirectas till Google och sedan tillbaka till dashboard

2. **Testa sign out:**
   - Klicka på sign out-knappen
   - Verifiera att du loggas ut och redirectas till startsidan

3. **Testa protected routes:**
   - Försök gå till `/dashboard` utan att vara inloggad
   - Verifiera att du redirectas till `/auth/signin`

## Nästa steg

1. ✅ Konfigurera Supabase projekt
2. ✅ Lägg till environment variables
3. ✅ Konfigurera Google OAuth i Supabase
4. ⏳ Uppdatera återstående sidor (se lista ovan)
5. ⏳ Testa Google OAuth-inloggning
6. ⏳ Ta bort `next-auth` paketet när allt fungerar

## Hjälp

Om du stöter på problem:
1. Kontrollera att Supabase environment variables är korrekt satta
2. Kontrollera att Google OAuth är korrekt konfigurerad i Supabase
3. Kontrollera Cloudflare Pages logs för felmeddelanden
4. Se till att redirect URL matchar exakt i både Google Cloud Console och Supabase
