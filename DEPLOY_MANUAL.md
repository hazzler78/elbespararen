# 🚀 Manual Deployment till Cloudflare Pages

## Steg 1: Förbered filer
✅ Build är klar i `.next` mappen

## Steg 2: Deploya via Cloudflare Dashboard

### 2.1 Gå till Cloudflare Dashboard
1. Öppna https://dash.cloudflare.com
2. Logga in med ditt konto
3. Gå till **Pages** i sidomenyn

### 2.2 Skapa nytt projekt (om det inte finns)
1. Klicka **"Create a project"**
2. Välj **"Upload assets"**
3. Namnge projektet: `elbespararen-v9`

### 2.3 Ladda upp filer
1. **Dra och släpp** hela `.next` mappen i upload-området
   - Eller klicka "Select from computer" och välj `.next` mappen
2. Klicka **"Deploy site"**

### 2.4 Konfigurera D1 binding
1. När deployment är klar, gå till **Settings** → **Functions**
2. Scrolla ner till **D1 Database bindings**
3. Klicka **"Add binding"**
4. Namn: `DB`
5. Database: `elbespararen-db`
6. Klicka **"Save"**

### 2.5 Testa deployment
1. Gå till din site URL (t.ex. `https://elbespararen-v9.pages.dev`)
2. Testa att appen fungerar
3. Gå till `/admin/providers` och testa att lägga till leverantörer

## 🎯 Nästa steg
När deployment är klar:
1. Testa admin i produktion
2. Lägg till Svekraft via admin-webben
3. Verifiera att den sparas i D1

## 🔗 Länkar
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Pages**: https://dash.cloudflare.com/pages
- **D1 Database**: https://dash.cloudflare.com/d1/databases
