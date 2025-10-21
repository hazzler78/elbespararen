# 🚀 Deploy till Cloudflare Pages

Eftersom Wrangler har autentiseringsproblem, använder vi Cloudflare Dashboard för att deploya.

## 📋 Steg 1: Pusha kod till GitHub

Din kod är redan pushad till GitHub! ✅

## 🌐 Steg 2: Skapa Cloudflare Pages Project

1. **Gå till:** [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Välj:** Workers & Pages
3. **Klicka:** Create Application → Pages → Connect to Git

## 🔗 Steg 3: Anslut GitHub Repository

1. **Välj GitHub** som source
2. **Auktorisera Cloudflare** att läsa dina repositories
3. **Välj repository:** `hazzler78/elbespararen`
4. **Välj branch:** `main`

## ⚙️ Steg 4: Konfigurera Build Settings

```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (leave empty)
```

### Environment Variables:
Lägg till dessa:
```
NODE_VERSION=20
OPENAI_API_KEY=your-openai-key-here
```

## 🗄️ Steg 5: Bind D1 Database

Efter att projektet är skapat:

1. Gå till din Pages project
2. **Settings** → **Functions**
3. **D1 database bindings**
4. **Add binding:**
   - Variable name: `DB`
   - D1 database: `elbespararen-db`
5. **Save**

## 🚀 Steg 6: Deploy

1. **Gå till:** Deployments
2. **Klicka:** Retry deployment (eller vänta på automatisk deploy)
3. **Vänta** ~2-3 minuter

## ✅ Steg 7: Verifiera

När deployment är klar:

1. **Öppna din URL:** `https://elbespararen.pages.dev` (eller liknande)
2. **Gå till:** `/admin/providers`
3. **Lägg till Svekraft!** (nu sparas den i D1!)

## 🎯 Steg 8: Custom Domain (Valfritt)

Om du vill ha egen domän:

1. **Custom domains** → **Set up a custom domain**
2. Följ instruktionerna för att lägga till `elbespararen.se` eller liknande

---

## 🔍 Troubleshooting

### Problem: Build failar
**Lösning:** Kontrollera att NODE_VERSION=20 är satt

### Problem: "Database not found"
**Lösning:** Kontrollera D1 binding är korrekt (DB → elbespararen-db)

### Problem: Admin fungerar men sparar inte
**Lösning:** Kolla att D1 binding är satt under Settings → Functions

---

## 📝 Quick Checklist

- [ ] GitHub repo pushad
- [ ] Cloudflare Pages projekt skapat
- [ ] Build settings konfigurerade
- [ ] Environment variables satta
- [ ] D1 database binding tillagd
- [ ] Första deployment lyckad
- [ ] Admin-sida fungerar
- [ ] Kan lägga till leverantör via admin

---

## 🎉 När det fungerar

Nu kan du:
- ✅ Lägga till leverantörer via admin på production-sidan
- ✅ Användare ser riktiga leverantörer från D1
- ✅ Alla ändringar pushas automatiskt (CI/CD)

**Lycka till!** 🚀
