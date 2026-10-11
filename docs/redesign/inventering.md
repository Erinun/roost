# Inventering inför grafisk ombyggnad (Fas 0)

Datum: 2026-10-11. Endast läsning — inga ändringar gjorda. Tre parallella utforskningar: stack/styling, ytor, avvikelser.

## 1. Stack och styling

- **Versioner:** React 19.2.4, Vite 6.0.3, TypeScript 5.6.2, **Tailwind CSS 3.4.15** (v3, klassisk `tailwind.config.js`, inte v4/@theme). PostCSS + autoprefixer.
- **Färger i dag:** hybrid av Tailwind-config och CSS-variabler.
  - `tailwind.config.js` definierar `primary` (11 steg som `var(--color-primary-*, fallback)`, standard cyan `#0ea5e9`), `surface` (neutral grå), `accent` (reaktionsfärger), `success/warning/error/info`.
  - `src/contexts/SiteSettingsContext.tsx` genererar `--color-primary-50…950` vid körning utifrån adminens valda primärfärg (**dynamisk personalisering** — logik, får inte tas bort).
- **Typsnitt:** Inter + Noto Nastaliq Urdu via Google Fonts-länk i `index.html` (rad 28–31). `fontFamily.sans` = Inter-stack i `tailwind.config.js`. Inga lokala fontfiler i repot.
- **Komponentbibliotek:** inget (ingen shadcn/Radix). Baskomponenter är CSS-klasser i `src/index.css` (@layer components): `.btn/.btn-primary/.btn-secondary/.btn-ghost/.btn-danger`, `.card/.card-hover`, `.input/.input-error`, `.label`, `.avatar(-sm/md/lg/xl)`, `.badge(-primary/success/warning/error)`, `.dropdown-menu/.dropdown-item`, `.modal-overlay/.modal-content`, `.table-*`, `.skeleton`.
- **Global CSS:** `src/index.css` — base (reset, fokus/selection), components, utilities (scrollbar, mentions, RTL, line-clamp), Quill-dark-mode (23 hårdkodade hexvärden).
- **Ikoner:** `lucide-react` 0.460.0, importeras per komponent.
- **Mörkt läge:** `darkMode: 'class'`, `ThemeContext` (light/dark/system, localStorage), flash-skydd i `index.html`. ~2 308 `dark:`-instanser.
- **Skuggor/radier:** egna `boxShadow`-tokens (`soft/card/elevated` + dark-varianter) i config. Radier: standard Tailwind + `rounded-4xl` (2rem). Projektregeln "inga box-shadows på kort" följs inte fullt ut (`shadow-card` ligger i `.card`-klassen; hover `shadow-elevated` på kort förekommer).
- **Metadata:** `index.html` (title, description, theme-color `#0ea5e9`, favicon-länkar), manifest dynamiskt via `/api/site-settings/manifest.webmanifest`; titel och favicon uppdateras i körtid av `SiteSettingsContext`.

## 2. Ytor

### Startadressen i dag

`/` ligger bakom `ProtectedRoute` → utloggade **omdirigeras till `/login`**. Inloggade får `src/pages/Home.tsx` (flöde + widgets) i `MainLayout`. Ingen publik landningssida finns.

### Routes (ur `src/App.tsx`)

- **Auth (`AuthLayout`):** `/login`, `/signup`, `/forgot-password`, `/reset-password`; dessutom `/confirm-email`, `/banned`, `/subscription-required`, `/upgrade`.
- **Skyddade (`MainLayout`):** `/`, `/explore`, `/classrooms`, `/classrooms/:slug`, `/classrooms/:slug/settings`, `/classrooms/:slug/leaderboard`, `/leaderboard`, `/members`, `/profile`, `/profile/:username`, `/settings`, `/guide`, `/showcase`, `/showcase/submit`, `/showcase/:id`, `/post/:postId`, `/roadmap`, `/roadmap/all`, `/roadmap/:id`.
- **Premium (`requirePremium`):** `/messages`, `/messages/:userId`, `/calendar`, `/activations`, `/live`.
- **Admin (`AdminRoute` + `AdminLayout`):** `/admin` + 10 undersidor (users, content, categories, announcements, subscriptions, showcases, backups, activations, live-room, site-settings).

### Områden och nyckelfiler

| Område | Sidor | Komponenter |
|---|---|---|
| Auth | `src/pages/auth/` (7 st) | `src/components/auth/`, `src/layouts/AuthLayout.tsx` |
| Appens skal | — | `src/components/navigation/TopNav.tsx`, `SideNav.tsx`, `src/layouts/MainLayout.tsx`, `src/components/common/`, `src/components/notifications/`, `src/components/search/GlobalSearch.tsx` |
| Flöde | `Home.tsx`, `Explore.tsx`, `PostDetail.tsx` | `src/components/feed/` (13 st) |
| Klassrum | `Groups.tsx`, `GroupDetail.tsx`, `GroupSettings.tsx` | `src/components/groups/` (17) + `groups/learn/` (11) |
| Direktmeddelanden | `Messages.tsx` | `src/components/messages/` (8) |
| Evenemang/live/aktivering | `Calendar.tsx`, `LiveRoom.tsx`, `Activations.tsx` | `src/components/events/`, `src/components/calendar/CalendarView.tsx`, `src/components/live-room/` |
| Premium | `Upgrade.tsx`, `SubscriptionRequired.tsx` | `ProBadge.tsx`, `SubscriptionBadge.tsx` (i `common/`) |
| Profil/inställningar | `Profile.tsx`, `Settings.tsx` | `src/components/profile/`, `src/components/settings/` |
| Medlemmar/topplista/showcase/roadmap/guide | `Members.tsx`, `Leaderboard.tsx`, `Showcase*.tsx`, `FeatureRequest*.tsx`, `Guide.tsx` | `members/`, `leaderboard/`, `showcase/`, `feature-requests/` |
| Admin | `src/pages/admin/` (11) | `src/components/admin/`, `src/layouts/AdminLayout.tsx` |
| E-post/metadata | — | `server/src/services/email.ts`, `server/src/routes/email-preview.ts`, `index.html`, `public/` (favicons, loggor, manifest) |

**Terminologi:** plattformen använder genomgående **"klassrum"** (aldrig "grupp") sedan översättningen i oktober 2026. Landningssidans referenstexter säger "grupper" — se öppna frågor i planen.

### E-post

`server/src/services/email.ts` (+ `email-preview.ts`): välkomst, prenumeration uppsagd/återaktiverad, lösenordsåterställning. Egen palett (`#667eea` lila m.m.) som inte matchar vare sig dagens frontend eller profilen.

## 3. Avvikelser

- **Hårdkodade färgvärden:** ~113 träffar i 14 filer. Värst: `src/components/calendar/CalendarView.tsx` (42), `src/index.css` (23, Quill-dark), `server/src/routes/email-preview.ts` (20), `server/src/services/email.ts` (15), `src/pages/admin/SiteSettings.tsx` (10, färg-presets), `src/types/showcase.ts` (9, kategorifärger), `src/pages/admin/Categories.tsx` (8, presets), `src/components/groups/learn/GroupAbout.tsx` (6).
- **Arbitrary values (`bg-[#…]`):** 0 träffar.
- **Inline-stilar med färg:** ~8 ställen, mest dynamiska från databasen (`category.color`, `form.primary_color`) med hårdkodade fallbackar (`#666`, `#6b7280`).
- **Inter:** 4 förekomster — `index.html` (Google Fonts), `tailwind.config.js`, `src/index.css` (RTL-stack). Inget npm-paket.
- **Övertoningar:** 38+ komponenter. Vanligast `from-primary-400 to-primary-600` (avatar-fallbackar, headers) och `from-amber-400 to-orange-500` (premium).
- **Skuggor:** shadow-klasser i 59 filer; `.card` har `shadow-card` inbyggt trots regeln "inga box-shadows på kort".
- **Grönt:** används som status/success (inte som primärknapp — primären är cyan `#0ea5e9`). Enstaka gröna knappar: 2FA-setup, "gå till community".
- **Premium i dag:** amber/orange-gradienter och amber-badges (`GroupCard`, `GroupHeader`, `SubscriptionBadge`, `CreateGroupModal`).
- **SVG:** inga låsta fill/stroke-färger av betydelse; lucide + Tailwind-klasser.

## 4. Underlagsstatus (avsnitt 2 i uppdraget)

| Fil enligt uppdraget | Status |
|---|---|
| `docs/design/Grafisk_profil_2023.pdf` | **Saknas.** Alla värden finns dock i uppdragets avsnitt 3. |
| `docs/design/landningssida-referens.md` | Finns som `Landningssidan/sida 1.md` (annan sökväg). |
| `docs/design/landningssida-forslag.png` | Finns som `Landningssidan/Landningssida.png`. |
| `docs/design/inloggning-nuvarande.png` | Saknas; `public/guide-screenshots/login.png` visar dagens inloggning. |
| `public/brand/` | **Saknas.** Däremot finns `public/logo-hd.png`, `public/logo-square-sm.png`, `public/logo-square-sm-dark.png` (dagens Roost-loggor). |
| Ciutadella-fontfiler / webfont-kit | **Saknas** i repot. Barlow blir tillfällig ersättare via en CSS-variabel. |
| PT Sans / PT Serif lokalt | Saknas; läggs till lokalt (öppen licens, t.ex. @fontsource). |
