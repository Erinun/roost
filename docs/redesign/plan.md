# Plan: ombyggnad till Aktiespararnas grafiska profil 2023

Bygger på `docs/redesign/inventering.md`. Gren: `redesign/grafisk-profil`, minst en commit per fas. Ingen fil ägs av mer än ett paket; fas 1 körs ensam före fas 2 och får därför röra grundfiler som fas 2-paketen sedan bara läser.

## Fas 1 — Designgrunden (en agent, sekventiell)

**Äger:** `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `index.html`, `src/fonts/` (ny), `src/pages/Styleguide.tsx` (ny), `src/pages/auth/Login.tsx`, `src/layouts/AuthLayout.tsx`, `docs/redesign/designsystem.md` (ny), `src/App.tsx` (endast tillägg av `/styleguide`-route — lämnas sedan till paket A).

Innehåll:

1. **Tokens** i `tailwind.config.js` + CSS-variabler: profilens nio färger med namnen ur profilen, de tre övertoningarna (blå/lila/varm) som bakgrundstokens, neutralerna (`#0E2A4D`, `#4A5B73`, `#D5E1EE`, `#F3F7FC`, vit), radier, avstånd, skuggor. Befintlig `--color-primary-*`-mekanism behålls men standard byts till `#185DA9`-skalan (personaliseringslogiken röras inte).
2. **Typsnitt lokalt:** PT Sans + PT Serif + Barlow via @fontsource (lokala filer, ingen extern tjänst). Rubrikfamilj via en enda CSS-variabel `--font-heading: Ciutadella, Barlow, …` så ett framtida Ciutadella-köp är en rads ändring. Inter och Google Fonts-länken tas bort.
3. **Baskomponenter** i `src/index.css` omgjorda: btn (primär = primärblå), länk, input, label, card (**utan box-shadow**, endast border — rättar även dagens regelbrott), badge (inkl. gul premium-variant med mörk text), dropdown, modal, tabell, skeleton, avatar, flikar, avisering — med hover/fokus/inaktiv/fel-tillstånd och synlig fokusring i `#185DA9`.
4. **`/styleguide`** som visar tokens, övertoningar och alla baskomponenter.
5. **Inloggningssidan** ombyggd som första riktiga sida (Login + AuthLayout).
6. **`docs/redesign/designsystem.md`**: tokens, kontrastregler (mörk text på gult/orange/grönt, vit bara på blått/lila), när varje färg används.

**Kontrollpunkt:** skärmbilder av `/styleguide` och `/login` i 390 och 1440 px → invänta godkännande.

## Fas 2 — Arbetspaket (parallella agenter)

Regler för alla: endast tokens/komponenter från fas 1, inga hårdkodade färger, ingen logik, inga filer utanför paketet. Saknad token/komponent rapporteras till orkestreraren som låter fas 1-agenten lägga till den.

| Paket | Omfattning | Äger |
|---|---|---|
| **A. Landningssidan** | Ny publik sida på `/` för utloggade enligt referensen (hero med blå övertoning + snedskuren kant, kort, tre steg, medlemskap, citat på lila övertoning, FAQ, avslutande uppmaning). Platshållare (`[PRIS]` m.fl.) står kvar synliga. | `src/pages/Landing.tsx` (ny), `src/components/landing/` (ny), `src/App.tsx` |
| **B. Auth-resten** | Skapa konto, glömt/återställ lösenord, bekräfta e-post, avstängd, prenumeration krävs. Läser AuthLayout, ändrar den inte. | `src/pages/auth/` utom `Login.tsx` |
| **C. Appens skal** | TopNav, SideNav, MainLayout, notiser, global sökning, ErrorBoundary/tomma lägen/laddning, OnlineIndicator. | `src/components/navigation/`, `src/layouts/MainLayout.tsx`, `src/components/notifications/`, `src/components/search/`, `src/components/common/` utom Pro-/SubscriptionBadge |
| **D. Flöde** | Hem, utforska, inläggsdetalj, feed-komponenter inkl. Quill-styling via tokens. | `src/pages/Home.tsx`, `Explore.tsx`, `PostDetail.tsx`, `src/components/feed/` |
| **E. Klassrum** | Översikt, detalj, inställningar, learn-läget. `GroupAbout.tsx`:s 6 hårdkodade färger ersätts med tokens. | `src/pages/Groups.tsx`, `GroupDetail.tsx`, `GroupSettings.tsx`, `src/components/groups/` |
| **F. Direktmeddelanden** | Chattvy, konversationslista, bubblor, tomt läge. | `src/pages/Messages.tsx`, `src/components/messages/` |
| **G. Evenemang, kalender, live, aktiveringar** | Kalendern (42 hårdkodade färger → tokens), eventkort/formulär/RSVP, live-rum, aktiveringar. | `src/pages/Calendar.tsx`, `LiveRoom.tsx`, `Activations.tsx`, `src/components/events/`, `src/components/calendar/`, `src/components/live-room/` |
| **H. Premium** | Uppgraderingssidan med varm övertoning + mörk text, premiummärkning (gul etikett, mörk text). Endast utseende — ingen Stripe-logik. | `src/pages/Upgrade.tsx`, `src/components/common/ProBadge.tsx`, `SubscriptionBadge.tsx` |
| **I. Profil, inställningar, medlemmar, topplista, showcase, roadmap, guide** | Sid- och kortombyggnad; kategorifärg-presets i `showcase.ts`/`Categories.tsx` byts till profilens palett (endast konstantvärden, ingen logik). | `src/pages/Profile.tsx`, `Settings.tsx`, `Members.tsx`, `Leaderboard.tsx`, `Showcase*.tsx`, `FeatureRequest*.tsx`, `Guide.tsx`, `src/components/profile/`, `settings/`, `members/`, `leaderboard/`, `showcase/`, `feature-requests/`, `src/types/showcase.ts` |
| **J. Admin** | Adminlayout + 11 sidor, färg-presets i SiteSettings mot profilens palett. | `src/pages/admin/`, `src/components/admin/`, `src/layouts/AdminLayout.tsx` |
| **K. E-post, favicon, metadata** | E-postmallarna till profilens palett (inline-CSS, mörk text på gult/orange), favicon/delningsbild/manifest-färger. | `server/src/services/email.ts`, `server/src/routes/email-preview.ts`, `public/` (ikoner, manifest) |

Startordning: A kan starta direkt efter fas 1; övriga parallellt. B väntar inte på något (AuthLayout är klar i fas 1).

## Fas 3 — Granskning (agenter som inte byggt)

1. **Konsekvens:** sök kvarvarande `#0ea5e9`, cyan-/amber-klasser, Inter, hex utanför tokenfiler.
2. **Tillgänglighet:** kontrast per uppdragets tabell, fokus, tangentbord, 44 px tryckytor, formuläretiketter.
3. **Visuellt:** skärmbilder 390/768/1440 px per sida, ingen vågrät rullning på mobil.
4. **Regression:** `npm run build`, lint, `npx tsc --noEmit`, tester; diff-kontroll att ingen logik/API/databas ändrats.

Fynd skickas till ägande paket, omgranskning tills listan är tom. Därefter slutrapport.

## Startadressen — föreslagen lösning (ingen auth-ändring)

I `src/App.tsx` görs `/` till en växel: utloggad → `<Landing />` (publik), inloggad → dagens `ProtectedRoute + MainLayout + Home`. Autentisering, guards och övriga adresser röras inte; inloggade hamnar exakt där de hamnar i dag. `/login`-redirecten för övriga skyddade sidor behålls.

## Beslut (besvarade av beställaren 2026-10-11)

1. **Terminologi på landningssidan:** referensens texter används ordagrant — "grupper" behålls på landningssidan trots att plattformen i övrigt säger "klassrum".
2. **Logotyp:** LOGO-platshållarna står kvar tills originalfiler läggs i `public/brand/`. Befintliga `public/logo-*.png` används inte på landningssidan. Appens dynamiska logotyp via site-inställningarna röras inte (logik).
3. **Mörkt läge:** behålls; mörka neutraler härleds från profilens palett och dokumenteras som avvikelse i slutrapporten.
4. **Dynamisk primärfärg:** standard byts till `#185DA9`-skalan; personaliseringsfunktionen behålls orörd.
5. **Git:** befintliga okommitterade ändringar committas på `main` innan grenen `redesign/grafisk-profil` skapas.

## Platshållare som återstår (listas även i slutrapporten)

`[PRIS]`, `[PRIS OCH BETALNINGSPERIOD]`, `[UPPSÄGNINGSVILLKOR]`, `[FUNKTION I GRATISVERSIONEN]` ×3, `[CITAT FRÅN EN MEDLEM …]`, `[NAMN, MEDLEM SEDAN ÅR]`, `[SKÄRMBILD FRÅN PLATTFORMEN]`, `[Villkor]`, `[Integritetspolicy]`, `[Kontakt]`, `[ÅR] [ORGANISATION]`, logotypfiler (`public/brand/`), Ciutadella-licens.
