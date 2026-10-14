# Medlemsportalen

Medlemsportalen är en separat, mobilanpassad webbapp för föreningsmedlemmar. Den ger medlemmar en enkel vy av föreningens publika innehåll — nyheter, aktiviteter och kontakt — utan att exponera föreningens interna arbetsyta (möten, beslut, uppgifter, dokument, intern kommunikation).

Portalen hör ihop med **Föreningsarbetsytan** i huvudplattformen (`/associations` i Roost), som är styrelsens/de förtroendevaldas interna verktyg. Samma förening, samma databas — två olika frontends för två olika målgrupper.

## Vad portalen innehåller

| Sida | Route | Innehåll |
|------|-------|----------|
| Hem | `/` | Hälsning, de tre senaste nyheterna ("Senaste nytt") och nästa kommande aktivitet |
| Nyheter | `/news`, `/news/:id` | Publicerade nyheter (`member_news`) med detaljvy |
| Aktiviteter | `/activities` | Publicerade aktiviteter med anmälan/avanmälan via `activity_signups` |
| Kontakt | `/contact` | Föreningens kontaktuppgifter (`contact_info`), formulär för att ställa en fråga (`member_questions`) samt "Mina frågor" med svarstråd (`member_question_replies`) |

Tillhör användaren flera föreningar visas en föreningsväljare i topbaren; valet sparas i `localStorage`. Saknar kontot föreningsmedlemskap visas en vänlig "Ingen förening hittades"-vy.

**Ingen registrering sker i portalen.** Konton skapas och bjuds in via huvudplattformen; portalen har endast inloggning (`/login`).

## Arkitektur

- **Egen Vite-app** i `member-portal/` (React 19, TypeScript, Tailwind CSS, react-router). Helt fristående `package.json` och build — den delar ingen kod med huvudappen.
- **Delat Supabase-projekt och delad auth.** Portalen använder samma `VITE_SUPABASE_URL` och `VITE_SUPABASE_PUBLISHABLE_KEY` som huvudappen, så samma konto fungerar i båda apparna.
- **Behörighet styrs helt av RLS** (Row Level Security) i databasen — portalen innehåller ingen egen rollogik. Frågorna mot `member_news`, `association_activities`, `member_questions` m.fl. returnerar bara det som användarens roll tillåter. Schemat ligger i `migrations/062_association_workspace.sql`.
- **Avsiktlig typduplicering.** `member-portal/src/types.ts` är en kopia av de typer portalen behöver från `src/types/association.ts` i huvudappen. Eftersom portalen är en separat kodbas är dupliceringen avsiktlig — håll filerna i synk manuellt när schemat ändras.

### Kodstruktur

```
member-portal/
├── src/
│   ├── App.tsx              # Routes + skyddat skal (kräver inloggning + medlemskap)
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Supabase-auth (session, profil, signOut)
│   │   └── AssociationContext.tsx  # Användarens föreningar + vald förening
│   ├── components/
│   │   ├── Layout.tsx       # Topbar + fast bottennavigation (mobil)
│   │   └── LoadingScreen.tsx
│   ├── pages/               # Home, News, NewsDetail, Activities, Contact, Login
│   ├── lib/supabase.ts      # Supabase-klient
│   └── types.ts             # Duplicerade typer (se ovan)
├── .env.example             # Mall för .env.local
└── vite.config.ts           # Port 5100, chunk-uppdelning
```

## Rollmodellen

Roller ligger i `association_members.role` (enum `association_role`):

| Roll | Åtkomst |
|------|---------|
| `admin` | Full åtkomst till arbetsytan + medlemshantering och inställningar |
| `internal` | Full åtkomst till arbetsytans innehåll (möten, uppgifter, dokument, intern kommunikation) |
| `member` | **Endast medlemsportalen** — RLS spärrar allt internt innehåll |

Plattformsadministratörer (Roost-admin) kan skapa föreningar och agerar admin i alla föreningar.

## Köra lokalt

1. Skapa env-filen (gitignorerad, skapas manuellt):

   ```bash
   cp member-portal/.env.example member-portal/.env.local
   ```

   Fyll i värdena — samma Supabase-projekt som huvudappen:

   | Variabel | Beskrivning |
   |----------|-------------|
   | `VITE_SUPABASE_URL` | Supabase-projektets URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (samma som huvudappen) |
   | `VITE_APP_NAME` | Portalens namn, t.ex. `Medlemsportalen` |

2. Installera beroenden (första gången):

   ```bash
   npm --prefix member-portal install
   ```

3. Starta dev-servern från roost-roten:

   ```bash
   npm run dev:portal
   ```

   Portalen körs på **http://localhost:5100** (huvudappen kör på port 5000 — de kan köras samtidigt).

## Bygga

```bash
npm run build:portal
```

Bygget hamnar i `member-portal/dist/` (statiska filer). Typkontroll körs separat: `npm --prefix member-portal run typecheck`.

## Deployment

Rekommendation: deploya portalen som en **egen statisk site**, byggd från `member-portal/`, på en egen subdomän — t.ex. `medlem.<din-domän>` — bredvid huvudplattformen.

- **Railway / Vercel / Netlify**: peka builden på `member-portal/` som rotkatalog (eller kör `npm run build:portal` från repo-roten) och servera `member-portal/dist/`.
- Sätt `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` och `VITE_APP_NAME` som build-miljövariabler.
- Portalen är en SPA — konfigurera fallback så att alla paths serveras med `index.html` (annars 404 vid t.ex. `/news/:id` på direktlänk).
- Glöm inte att lägga till portalens domän under **Authentication → URL Configuration** i Supabase om redirect-flöden används.

Ingen backend behövs utöver Supabase — portalen pratar direkt med databasen via RLS.
