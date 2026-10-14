# FORTSÄTTNING — Föreningsarbetsyta + Medlemsportal

**Datum:** 2026-10-14
**Branch:** `feature/foreningsarbetsyta` (i `C:\Dev\Skool Roost\roost`)
**Plan:** `docs/superpowers/plans/2026-10-14-foreningsarbetsyta-medlemsportal.md`
(OBS: `docs/superpowers/` är gitignorerad — planfilen finns bara lokalt på disk. Radera den inte!)

## Vad som byggs

Projekt (Showcase) ersätts med **Föreningsarbetsyta** (föreningar med möten, beslut, uppgifter,
dokument, aktiviteter, nyheter, kommunikation, medlemsfrågor) + en separat mobilanpassad
**Medlemsportal** (`member-portal/`, egen Vite-app, port 5100) som delar Supabase-backend och auth.
Behörighet via RLS: roll `admin`/`internal` = intern arbetsyta, `member` = endast portalen.

---

## ✅ KLART (committat och granskat — alla tasks godkända i tvåstegsgranskning)

| Task | Innehåll | Commits |
|---|---|---|
| — | Tidigare okommitterat arbete säkrat (inbjudningar, realtime-migration 061, landningssida) | `889b856` |
| 1 | DB-migration `migrations/062_association_workspace.sql` — 5 enums, 14 tabeller, RLS, hjälpfunktioner (is_association_admin/internal/member) + GRANT EXECUTE. **APPLICERAD MOT LIVE SUPABASE.** `src/types/database.ts` regenererad | `6a89105` |
| 2 | `src/types/association.ts` + `src/services/association.ts` (föreningar, medlemmar, arbetsgrupper) + 12 tester | `7aeabc7` |
| 3 | `src/services/association-meetings.ts` + `association-tasks.ts` (möten, beslut, uppgifter, createTaskFromDecision) + 27 tester | `0c1a5b9` |
| 4 | `src/services/association-docs.ts` + `association-portal.ts` (dokument, inlägg, aktiviteter, anmälningar, nyheter, frågor) + 47 tester | `576f293` |
| 9 | **Medlemsportal-grund**: `member-portal/` komplett scaffold — auth (inloggning), föreningsval, mobil layout med bottennav, startsida (Hej + Senaste nytt + Nästa aktivitet). Bygger grönt. Stubbar för News/NewsDetail/Activities/Contact | `a6f901c` |
| 5 | **Showcase/Projekt HELT BORTA** ur frontend (sidor, komponenter, service, typer, admin, nav — även TopNav). Ny nav-post "Föreningar" → `/associations`. `AssociationList` (+ skapa förening-modal för plattformsadmin), `AssociationWorkspace` (fliklayout, rollspärr) + 10 flikstubbar + nested routes | `c37e242`, `18ef1e2` |
| — | Städning: `VITE_ENABLE_SHOWCASE` bort ur `.env.example` | `742a7cb` |

**Verifierat:** `npx tsc --noEmit` grönt, `npm run build` grönt, 86 nya tester gröna,
`member-portal`: tsc + build gröna.

### Viktiga namn (avviker från ursprungsplanen pga krockar)
- `uploadAssociationDocument` (inte uploadDocument — krock med s3.ts)
- `getAssociationPosts` / `createAssociationPost` / `deleteAssociationPost` (krock med post.ts)
- `updateAssociationMemberRole` = alias i `services/index.ts` (krock med group.ts); direktimport från
  `@/services/association` heter `updateMemberRole`

---

## ⬜ ÅTERSTÅR

### Task 6 — Flikar: Översikt, Möten (+detalj), Uppgifter
Fyll stubbarna `src/pages/associations/tabs/WorkspaceOverview.tsx`, `WorkspaceMeetings.tsx`,
`WorkspaceMeetingDetail.tsx`, `WorkspaceTasks.tsx`. Se plan Task 6. Kärna: mötesdetalj med
agenda/protokoll, beslutslista och **"Skapa uppgift" från beslut** (`createTaskFromDecision`);
uppgiftstavla i tre kolumner (Att göra/Pågår/Klart) med ansvarig + deadline.
Kontext i flikarna: `useOutletContext<WorkspaceContext>()` från `../AssociationWorkspace`.

### Task 7 — Flikar: Dokument, Kommunikation, Aktiviteter, Nyheter
Fyll `WorkspaceDocuments.tsx`, `WorkspacePosts.tsx`, `WorkspaceActivities.tsx`, `WorkspaceNews.tsx`.
Se plan Task 7. Kärna: dokumentuppladdning (`uploadAssociationDocument`), inläggsflöde med svar
(**svar endast på toppinlägg** — en nivå), aktiviteter med **"Publicera till medlemsportalen"**
(`publishActivity`/`unpublishActivity`), nyheter med utkast→publicera (`publishNews`).

### Task 8 — Flikar: Frågor, Inställningar
Fyll `WorkspaceQuestions.tsx` (intern vy över medlemsfrågor: svara med
`addQuestionReply(..., true)`, statusändring) och `WorkspaceSettings.tsx` (endast admin:
föreningsinfo, medlemshantering med `searchProfiles` + roller, arbetsgrupper). Se plan Task 8.

### Task 10 — Medlemsportal: sidorna
Fyll `member-portal/src/pages/News.tsx`, `NewsDetail.tsx`, `Activities.tsx` (anmälan via
insert/delete i `activity_signups`), `Contact.tsx` (kontaktinfo + ställ fråga till `member_questions`
+ "Mina frågor" med svarstråd). Se plan Task 10.
**Åtgärda samtidigt:** `member-portal/src/pages/Home.tsx` ignorerar query-fel (granskningsfynd) —
visa felmeddelande i stället för tom-state vid fel.

### Task 11 — Dokumentation + slutverifiering
`docs/member-portal.md`, README-sektion, CLAUDE.md-uppdatering (Projekt → Föreningsarbetsyta,
member-portal/). Slutkör: `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run build`
(+ samma i member-portal). Grep: `showcase` får inte finnas i aktiv kod.

### Därefter
- Merge till huvudbranchen (basbranch: `redesign/grafisk-profil`) + deploy (Railway).
- Medlemsportalens deployment: egen statisk site (byggs från `member-portal/`), t.ex. subdomän
  `medlem.<domän>`. Env-värden finns i `member-portal/.env.local` (gitignorerad, lokal).

---

## Kända uppföljningspunkter (från granskningarna, ej blockerande)

1. **RLS:** `member_questions` UPDATE-policy låter interna skriva om medlemmens frågetext
   (inte bara status) — bör begränsas i en senare migration.
2. **getAssociationPosts:** svar-på-svar (nested replies) tappas tyst i trädbygget — UI:t ska
   därför bara erbjuda svar på toppinlägg (en nivå).
3. **5 pre-existerande testfel** i `src/services/notification.test.ts` (designtoken-refaktor,
   `text-red-600` vs `text-error-strong`) — fanns före detta arbete, bör fixas separat.
4. `.env.local` för member-portal är gitignorerad — måste skapas manuellt vid ny maskin
   (kopiera Supabase-värden från roost/.env.local).
5. Migration 062 är redan applicerad mot live-Supabase — kör den INTE igen.

## Så återupptar du arbetet

Starta Claude Code i `C:\Dev\Skool Roost` och skriv t.ex.:

> Läs roost/FORTSATTNING.md och planen i
> roost/docs/superpowers/plans/2026-10-14-foreningsarbetsyta-medlemsportal.md.
> Fortsätt implementationen: kör Task 6, 7, 8 och 10 med parallella subagenter
> (de rör disjunkta filer), granska varje task, committa per task, och avsluta med Task 11.

Arbetssätt hittills: en implementerings-subagent per task + granskande subagent (spec + kvalitet),
commit per task med `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
Regler: svenska i all UI (du-form, sv-SE-datum), inga `shadow-*` på kort, committa aldrig
`src/components/landing/LandingHeader.tsx` separat okänt innehåll — använd alltid explicita
`git add <filer>`.
