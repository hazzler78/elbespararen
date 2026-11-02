# Integritetspolicy – Elbespararen (elbespararen.se och elchef.se)

> UTKAST 2026-11-02, inte publicerat. Text inom [HAKPARENTES] måste fyllas i eller verifieras innan publicering.

**Senast uppdaterad: 2 november 2026**

Den här policyn gäller elbespararen.se och elchef.se. elchef.se leder till samma tjänst och samma system.

## 1. Vem ansvarar för dina personuppgifter?

Personuppgiftsansvarig är:

- **VKNG LTD** (bolaget bakom varumärkena Elchef, Elbespararen och Strømsjef)
- Registreringsnummer: **HE 477501** (Cyperns bolagsregister)
- Adress: Gladstonos 12–14, Flat 101–102, 8046 Paphos, Cypern
- E-post: info@elbespararen.se

Mejla oss om du har frågor om hur vi hanterar dina uppgifter eller vill använda dina rättigheter. Vi svarar inom en månad, oftast mycket snabbare.

## 2. Vilka uppgifter vi samlar in, varför, och med vilket lagstöd

| Uppgifter | Varför | Lagstöd (GDPR art. 6) |
|---|---|---|
| **Fakturabild du laddar upp.** Den innehåller ofta namn, adress, kundnummer, anläggnings-id, förbrukning och belopp. | Läsa av fakturan med AI och räkna ut vad du kan spara | Avtal (art. 6.1 b), alltså att leverera tjänsten du ber om |
| Postnummer och elområde | Räkna fram rätt priser | Avtal (6.1 b) |
| Analysresultat (avgifter, besparing) | Visa resultatet för dig | Avtal (6.1 b) |
| Meddelanden i chatten | Svara på dina frågor med AI | Avtal (6.1 b) |
| Namn, e-post och telefon när du begär byte, offert (t.ex. solceller) eller kontakt | Hantera din förfrågan och föra den vidare till den leverantör du valt | Avtal / åtgärder före avtal (6.1 b) |
| E-postadress för nyhetsbrev | Skicka nyhetsbrev | Samtycke (6.1 a). Du kan avregistrera dig när som helst. |
| Konto- och betalningsuppgifter (Premium) | Konto och betalning | Avtal (6.1 b) och bokföringslagen (6.1 c) |
| IP-adress och teknisk data | Säkerhet och felsökning | Berättigat intresse (6.1 f) |
| Statistik och beteendedata via cookies (Google Analytics, Hotjar) | Förbättra sajten | Samtycke via cookiebannern (6.1 a) |
| Fakturabild som sparas i 30 dagar | Felsökning, kvalitetskontroll och support om analysen blev fel | Berättigat intresse (6.1 f) |

## 3. Så hanteras din faktura, helt ärligt

- **Hela fakturabilden skickas till vår AI-leverantör xAI** (modellen Grok, grok-4.3, via api.x.ai) för att läsas av. Den skickas som den är och anonymiseras inte innan.
- **xAI sparar ingenting.** Vi använder xAI:s Zero Data Retention (ZDR). Det betyder att xAI inte lagrar din faktura eller svaret efter att analysen är klar, och inte använder dem för att träna sina modeller.
- **Vi sparar fakturabilden i 30 dagar** i vår lagring (Supabase, eller Cloudflare R2 som reserv) så att vi kan felsöka och hjälpa dig om analysen blev fel. Efter 30 dagar raderas bilden automatiskt. Den sparade bilden anonymiseras inte.
- **Vi tränar inte AI på dina fakturor.**
- Ladda bara upp din egen faktura. Vill du dela så lite som möjligt kan du dölja namn, adress och kundnummer innan du laddar upp. Analysen fungerar ändå.

## 4. Vilka vi delar uppgifter med (personuppgiftsbiträden och mottagare)

Vi säljer aldrig dina uppgifter. Vi använder följande leverantörer för att driva tjänsten. De får bara behandla uppgifterna för vår räkning.

| Leverantör | Vad | Var |
|---|---|---|
| **xAI / SpaceX Super Intelligence LLC** (Grok, grok-4.3, api.x.ai) | AI-analys av fakturor och chatt, med Zero Data Retention (inget sparas) | **USA.** xAI erbjuder ingen EU-region. xAI kan skicka anrop mellan sina regioner. |
| **Supabase Inc.** | Databas och lagring av fakturabilder | EU: Stockholm, Sverige (AWS eu-north-1) |
| **Cloudflare Inc.** (Workers/Pages, R2) | Drift av sajten och reservlagring av fakturabilder | [R2-PLATS/JURISDIKTION] ← KRÄVS. Global drift, USA-bolag. |
| **Resend** | Utskick av e-post från tjänsten | USA |
| **MailerLite** | Nyhetsbrev | EU (Litauen) [VERIFIERA] |
| **Stripe** | Betalningar (Premium) | EU/USA |
| **Google (Analytics)** och **Hotjar** | Statistik, bara med samtycke | USA / EU (Hotjar, Malta) |
| **Telegram** | Interna aviseringar till oss när du skickar en förfrågan (kontakt, byte, solcellsoffert) | Globalt / utanför EU |
| **Salesys** [VERIFIERA ROLL] | Avtalsbyte mot elbolag, när du själv väljer att byta | [LAND] |
| **Otovo** | Solcellsoffert, bara när du själv begär en | Norge (EES) |
| Det elbolag du väljer att byta till | Genomföra bytet | Sverige |

Vi lämnar också ut uppgifter till myndigheter när lagen kräver det.

## 5. Ingen AI-träning

Vi använder inte dina fakturor eller chattmeddelanden för att träna eller förbättra AI-modeller. xAI tränar inte heller på det vi skickar. Det framgår av xAI:s säkerhets-FAQ för API:et (docs.x.ai/developers/faq/security), och med ZDR sparas inget alls hos xAI.

## 6. Överföring till länder utanför EU/EES

Vissa leverantörer, framför allt **xAI** i USA, behandlar uppgifter utanför EU/EES.

- **xAI:** överföringen skyddas av EU-kommissionens standardavtalsklausuler (SCC, beslut 2021/914, modul 2) enligt xAI:s Data Processing Addendum (x.ai/legal/data-processing-addendum, gällande från 22 september 2026). Vi använder xAI:s Zero Data Retention, så xAI sparar inte fakturan eller svaret efter att analysen är klar.
- **Övriga USA-leverantörer** (Cloudflare, Resend, Stripe, Google, Supabase Inc.): överföringen sker med stöd av EU–US Data Privacy Framework, där leverantören är certifierad, och/eller standardavtalsklausuler. [VERIFIERA DPF-STATUS PER LEVERANTÖR]

Mejla oss om du vill ha en kopia av skyddsåtgärderna.

## 7. Hur länge vi sparar uppgifterna

| Uppgift | Lagringstid |
|---|---|
| Fakturabild | 30 dagar, sedan automatisk radering. Tidigare om du ber om det. |
| Hos xAI | Sparas inte (Zero Data Retention) |
| Analysresultat | [X DAGAR] |
| Förfrågningar (byte, offert, kontakt) | [X MÅNADER] efter avslutat ärende |
| Nyhetsbrev | Tills du avregistrerar dig |
| Betalningsuppgifter | 7 år (bokföringslagen) |
| Teknisk data och loggar | [X MÅNADER] |

## 8. Dina rättigheter

Du har rätt att:

- få veta vilka uppgifter vi har om dig och få en kopia av dem
- få felaktiga uppgifter rättade
- få dina uppgifter raderade, till exempel din faktura
- begränsa behandlingen och invända mot behandling som bygger på berättigat intresse
- få ut dina uppgifter i ett maskinläsbart format (dataportabilitet)
- när som helst ta tillbaka ett samtycke, till exempel för nyhetsbrev eller cookies

Mejla info@elbespararen.se.

**Klagomål:** Om du tycker att vi hanterar dina uppgifter fel kan du klaga hos Integritetsskyddsmyndigheten (IMY), www.imy.se, Box 8114, 104 20 Stockholm. Eftersom VKNG LTD är registrerat på Cypern är Cyperns dataskyddsmyndighet (Commissioner for Personal Data Protection, www.dataprotection.gov.cy) ansvarig tillsynsmyndighet, men du kan alltid vända dig till IMY i Sverige.

## 9. Säkerhet

Uppgifterna skickas krypterat (HTTPS/TLS). Bara behöriga personer har tillgång till lagrade fakturor.

## 10. Cookies

Se vår [cookiepolicy](/cookies). Analys- och beteendecookies (Google Analytics, Hotjar) används bara om du godkänner dem.

## 11. Ändringar

Vi uppdaterar policyn när tjänsten ändras. Datumet högst upp visar senaste versionen.
