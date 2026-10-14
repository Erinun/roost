# FORTSÄTTNING — Föreningsarbetsyta + Medlemsportal

**Datum:** 2026-10-14 (uppdaterad efter att ALLA tasks slutförts)
**Branch:** `feature/foreningsarbetsyta` (i `C:\Dev\Skool Roost\roost`)
**Plan:** `docs/superpowers/plans/2026-10-14-foreningsarbetsyta-medlemsportal.md`
(OBS: `docs/superpowers/` är gitignorerad — planfilen finns bara lokalt på disk. Radera den inte!)

## Vad som byggts

Projekt (Showcase) är ersatt med **Föreningsarbetsyta** (föreningar med möten, beslut, uppgifter,
dokument, aktiviteter, nyheter, kommunikation, medlemsfrågor) + en separat mobilanpassad
**Medlemsportal** (`member-portal/`, egen Vite-app, port 5100) som delar Supabase-backend och auth.
Behörighet via RLS: roll `admin`/`internal` = intern arbetsyta, `member` = endast portalen.

---

## ✅ ALLA TASKS KLARA (committade och granskade i tvåstegsgranskning)

| Task | Innehåll | Commits |
|---|---|---|
| — | Tidigare okommitterat arbete säkrat (inbjudningar, realtime-migration 061, landningssida) | `889b856` |
| 1 | DB-migration `migrations/062_association_workspace.sql` — 5 enums, 14 tabeller, RLS, hjälpfunktioner. **APPLICERAD MOT LIVE SUPABASE — kör den INTE igen.** | `6a89105` |
| 2 | `src/types/association.ts` + `src/services/association.ts` + 12 tester | `7aeabc7` |
| 3 | `association-meetings.ts` + `association-tasks.ts` + 27 tester | `0c1a5b9` |
| 4 | `association-docs.ts` + `association-portal.ts` + 47 tester | `576f293` |
| 9 | Medlemsportal-grund: scaffold, auth, föreningsval, layout, startsida | `a6f901c` |
| 5 | Showcase bort ur frontend; nav "Föreningar"; AssociationList + AssociationWorkspace + flikstubbar | `c37e242`, `18ef1e2`, `742a7cb` |
| 6 | Flikar Översikt, Möten (+detalj med beslut→uppgift), Uppgifter + delad `tabs/shared.ts` | `06a21e9` |
| 7 | Flikar Dokument, Kommunikation (svar endast på toppinlägg), Aktiviteter (publicera till portal), Nyheter (utkast→publicera) | `9703da5` |
| 8 | Flikar Frågor + Inställningar (föreningsinfo, medlemmar, arbetsgrupper; sista-admin-spärr; `onAssociationUpdated` i WorkspaceContext) | `aa82951` |
| 10 | Medlemsportal: Nyheter, Aktiviteter (23505-hantering, pendingIds-Set), Kontakt & frågor + Home-felhanteringsfix | `7d1f444` |
| 11 | `docs/member-portal.md`, README-sektion, CLAUDE.md-uppdatering, grep-kontroll showcase | (docs-commit) |

**Slutverifierat 2026-10-14:** `npx tsc --noEmit` grönt, `npm run lint` grönt, `npm run build` grönt,
`npx vitest run`: 140 passerade / 5 fallerade — de 5 är de KÄNDA för-existerande felen i
`src/services/notification.test.ts` (`getNotificationIconInfo`, designtoken-refaktor), inget nytt.
Member-portal: `tsc` + `build` gröna. Grep showcase: 0 träffar i aktiv frontend-kod
(kvarvarande träffar endast i schemabundna filer: `types/database.ts`, `db/`-adaptrarna,
`SiteSettingsContext` — speglar DB-schemat som avsiktligt lämnats orört).

### Viktiga namn (avviker från ursprungsplanen pga krockar)
- `uploadAssociationDocument` (inte uploadDocument — krock med s3.ts)
- `getAssociationPosts` / `createAssociationPost` / `deleteAssociationPost` (krock med post.ts)
- `updateAssociationMemberRole` = alias i `services/index.ts` (krock med group.ts); direktimport från
  `@/services/association` heter `updateMemberRole`
- `src/pages/associations/tabs/shared.ts`: delade konstanter/formatterare för flikarna
  (MEETING_STATUS_LABELS, TASK_STATUS_LABELS, formatDateTime, memberName, isOverdue)

---

## ⬜ ÅTERSTÅR (nästa session)

1. **Merge** till huvudbranchen (basbranch: `redesign/grafisk-profil`) + deploy (Railway).
2. **Medlemsportalens deployment**: egen statisk site (byggs från `member-portal/` med
   `npm run build:portal`), t.ex. subdomän `medlem.<domän>`. Env-värden finns i
   `member-portal/.env.local` (gitignorerad, lokal). SPA-fallback + Supabase redirect-URL behövs.
   Se `docs/member-portal.md`.

## Kända uppföljningspunkter (från granskningarna, ej blockerande)

1. **RLS:** `member_questions` UPDATE-policy låter interna skriva om medlemmens frågetext
   (inte bara status) — bör begränsas i en senare migration.
2. **getAssociationPosts:** svar-på-svar tappas tyst i trädbygget — UI:t erbjuder därför bara
   svar på toppinlägg (en nivå), enligt design.
3. **5 pre-existerande testfel** i `src/services/notification.test.ts` (designtoken-refaktor,
   `text-red-600` vs `text-error-strong`) — fanns före detta arbete, bör fixas separat.
4. `.env.local` för member-portal är gitignorerad — måste skapas manuellt vid ny maskin
   (kopiera Supabase-värden från roost/.env.local).
5. Migration 062 är redan applicerad mot live-Supabase — kör den INTE igen.
6. Mindre granskningsfynd som medvetet sköts upp (alla Minor): N+1 för kopplade uppgifter i
   mötesdetaljen, out-of-order-skydd i profilsökningen, `searchProfiles` interpolerar rå input i
   PostgREST-`.or()` (bör saneras i servicen), delad Modal-komponent för flikarna, pågående
   aktivitet hamnar under "Tidigare" i portalen (delning enbart på starts_at), svarsfält visas
   även för stängda frågor i portalen.

## Arbetssätt (för ev. fortsättning)

En implementerings-subagent per task + tvåstegsgranskning (spec + kvalitet) + fix-agenter + commit
per task med `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Regler: svenska i all UI
(du-form, sv-SE-datum), inga `shadow-*` på kort, alltid explicita `git add <filer>`
(aldrig `git add -A`), kolla branch före push.
