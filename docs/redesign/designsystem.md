# Designsystem – Roost enligt Aktiespararnas grafiska profil 2023

Fas 1: designgrunden. Detta dokument är kontraktet för fas 2 – alla sidor och
komponenter ska byggas med tokens och komponentklasser som beskrivs här.
Levande referens finns på `/styleguide`.

Tokendefinitionerna bor i två filer:

- `tailwind.config.js` – Tailwind-tokens (färger, övertoningar, typsnitt, radier, avstånd, skuggor)
- `src/index.css` – CSS-variabler (`:root`), basstilar och komponentklasser

Hårdkodade färger får bara förekomma i dessa två filer. I komponenter används
alltid tokens/klasser.

---

## 1. Namnsättning

Profilens nio färger ligger under namnrymden `brand` med korta, semantiska
namn (mönstret från spec-exemplet `brand.blue`, `brand.teal`):

| Token | Profilens namn | Hex | Roll |
|---|---|---|---|
| `brand-blue` | primary-blue-400 | `#185DA9` | Primärfärg: primära knappar, länkar, aktiv navigation, fokusring |
| `brand-sky` | secondary-blue-400 | `#159EDA` | Sekundär accent, informationsytor |
| `brand-teal` | green-400 | `#32D7CD` | Accent/bekräftelse – **alltid mörk text** |
| `brand-purple` | purple-700 | `#652FA0` | Sparsam accent: citat, kampanj/evenemang |
| `brand-plum` | purple-400 | `#973B8E` | Som ovan |
| `brand-pink` | pink-600 | `#EE0181` | Som ovan, bara stor text eller dekor |
| `brand-red` | red-500 | `#EC5345` | Fel/varning **på ytor**, inte som textfärg |
| `brand-orange` | orange-400 | `#F5A118` | Premium/framhävning – **alltid mörk text** |
| `brand-yellow` | yellow-500 | `#FBC231` | Premium/etiketter – **alltid mörk text** |

Varje färg finns också som CSS-variabel i `:root`: `--brand-blue`,
`--brand-sky` osv. Tailwind-klasserna (`bg-brand-blue`, `text-brand-purple` …)
läser variabeln med hex som fallback.

## 2. Övertoningar (bakgrundstokens)

| Token | Klass | Definition |
|---|---|---|
| `--gradient-blue` | `bg-gradient-blue` | 135°, `#185DA9 → #159EDA (55 %) → #32D7CD` |
| `--gradient-purple` | `bg-gradient-purple` | 135°, `#652FA0 → #973B8E (50 %) → #EE0181` |
| `--gradient-warm` | `bg-gradient-warm` | 135°, `#EC5345 → #F5A118 (50 %) → #FBC231` |

Användning: utvalda ytor – hero, avslutande uppmaning (CTA), premium, citat.
**Inte överallt.** Text direkt på en övertoning är riskabel (kontrasten
varierar längs ytan): lägg innehållet på en solid yta ovanpå (vit/mörkblå
panel), eller använd endast stor vit text och placera den i gradientens mörka
ände (blå/lila början). Aldrig vit text nära teal-/orange-/gul-änden.

## 3. Primärskalan (körtidstema)

`primary-50 … 950` är mekanismen för körtidstema: `SiteSettingsContext`
genererar `--color-primary-*` från administratörens valda primärfärg, och
Tailwind-klasserna läser `var(--color-primary-*, fallback)`. Fallbackarna är
nu genererade runt profilens primärblå (hue 211°), med **ankaret `#185DA9` på
steg 600** – det steg som knappar och länkar använder.

| Steg | Fallback-hex | Typisk användning |
|---|---|---|
| 50 | `#F1F7FD` | Tonade hoverytor |
| 100 | `#E0EDFB` | Tonade märken, markering |
| 200 | `#BDD8F4` | Dekor |
| 300 | `#8EBBEB` | Länkar/accent i mörkt läge |
| 400 | `#5497DE` | Accent i mörkt läge |
| 500 | `#2275CE` | Lättare primärton (vit text OK, 4,7:1) |
| **600** | **`#185DA9`** | **Primära knappar, länkar, fokusring (vit text 6,6:1)** |
| 700 | `#134D8B` | Hover på primära knappar, länk-hover |
| 800 | `#113D6F` | Aktivt/pressed-tillstånd |
| 900 | `#0F2E52` | Mörk markering |
| 950 | `#0A1D33` | Djupbotten |

Obs: ändra aldrig mekanismen (`var(--color-primary-*, …)`) – bara fallbackarna.

**Begränsning:** eftersom värdena är `var()`-strängar kan Tailwind inte lägga
alfa på dem – opacity-modifierare som `bg-primary-900/60` genererar ingen CSS
(och kraschar bygget i `@apply`). Använd alltid solida steg, eller `opacity-*`
på elementet för dekor.

## 4. Neutraler (`surface`-skalan)

Namnen `surface-50…950` behålls så att befintlig kod fungerar; **värdena** är
utbytta från rena grå till blåtonade neutraler härledda ur profilens
textmörkblå `#0E2A4D`:

| Steg | Hex | Roll (ljust läge) | Roll (mörkt läge) |
|---|---|---|---|
| 50 | `#F3F7FC` | Tonad yta/sidbakgrund (profilens tonade yta) | – |
| 100 | `#E8EFF7` | Tonade ytor, hover | – |
| 200 | `#D5E1EE` | **Linjer** (profilens linjefärg) | – |
| 300 | `#B9C9DE` | Fältkanter, rullningslister | – |
| 400 | `#8CA0BC` | Ikoner, dekor | Platshållare |
| 500 | `#5C7190` | Platshållartext (5,0:1 på vitt) | – |
| 600 | `#4A5B73` | **Dämpad text** (profilens, 6,9:1) | – |
| 700 | `#334862` | Etiketter, stark dämpad text | Linjer |
| 800 | `#1D3754` | – | Fält, menyer, tonade ytor |
| 900 | `#0E2A4D` | **Text** (profilens, 14,4:1) | Kortbakgrund |
| 950 | `#081E3A` | – | Sidbakgrund |

### Mörkt läge – härledda neutraler

Mörkt läge behålls (`darkMode: 'class'`). Botten är mörkblå ur
`#0E2A4D`-familjen i stället för tidigare neutralgrå:

- Sidbakgrund: `surface-950` `#081E3A`
- Kort/paneler: `surface-900` `#0E2A4D`
- Fält/menyer/upphöjda ytor: `surface-800` `#1D3754`
- Linjer: `surface-700` `#334862`
- Brödtext: `surface-50` `#F3F7FC`, dämpad text: `surface-300` `#B9C9DE` (9,9:1 på 950)
- Länkar/accent: `primary-300` `#8EBBEB` (7,2:1 på kortbakgrund)
- Feltext: `error-soft` `#F49B92` (6,8:1 på kortbakgrund)

## 5. Status- och accentfärger

| Token | Hex | Kommentar |
|---|---|---|
| `success` | `#32D7CD` | = brand-teal. Endast ytor/märken – aldrig som textfärg på ljus botten |
| `warning` | `#F5A118` | = brand-orange. Endast ytor/märken |
| `error` | `#EC5345` | = brand-red. Ytor och kantlinjer (3,6:1 mot vitt som icke-text) |
| `error-strong` | `#B23327` | Härledd mörkare röd: bakgrund för `.btn-danger` (vit text 6,2:1) |
| `error-soft` | `#F49B92` | Härledd ljusare röd: feltext i mörkt läge |
| `info` | `#159EDA` | = brand-sky |
| `accent-fire` | `#F5A118` | Reaktioner (mappade mot profilen) |
| `accent-love` | `#EC5345` | Reaktioner |
| `accent-clap` | `#FBC231` | Reaktioner |
| `accent-think` | `#973B8E` | Reaktioner |

## 6. Typografi

| Token | Stack | Användning |
|---|---|---|
| `font-heading` | `var(--font-heading)` = `Ciutadella, Barlow, 'PT Sans', sans-serif` | Alla rubriker (`h1–h6` får den automatiskt via basstil), fet vikt. Stora rubriker på färgad yta gärna i versaler |
| `font-sans` | `'PT Sans', system-ui, …` | Hela gränssnittet: brödtext, knappar, formulär, menyer, etiketter |
| `font-serif` | `'PT Serif', Georgia, serif` | Citat (`blockquote` får den automatiskt) och längre löptext |
| `font-mono` | `JetBrains Mono, Fira Code, monospace` | Kod, koder (systemfallback) |

- **Ciutadella är licensierad och finns inte i repot.** Barlow är ersättare.
  Framtida byte = lägg in Ciutadella-filerna och registrera `@font-face` –
  `--font-heading` behöver inte ändras (Ciutadella står först i stacken).
- Alla typsnitt laddas lokalt via `@fontsource/pt-sans`, `@fontsource/pt-serif`
  och `@fontsource/barlow` (importer överst i `src/index.css`). Ingen extern
  typsnittstjänst.
- Inter är borttaget helt (Google Fonts-länken i `index.html`, Tailwind-stacken
  och RTL-stacken).

## 7. Kontrastregler (WCAG 2.1: 4,5:1 vanlig text, 3:1 stor text)

Uppmätta kontraster mot vitt: blue 6,6 · sky 3,0 · teal 1,8 · purple 8,5 ·
plum 6,3 · pink 4,2 · red 3,6 · orange 2,1 · yellow 1,6.

- **Vit text OK (alla storlekar):** `brand-blue`, `brand-purple`, `brand-plum`,
  `primary-500–950`.
- **Vit text ENDAST stor text (≥ 24 px, eller ≥ 19 px fet):** `brand-pink`,
  `brand-red`, `brand-sky`.
- **Vit text ALDRIG:** `brand-teal`, `brand-orange`, `brand-yellow` – där
  används alltid mörk text `surface-900` (`#0E2A4D`; teal 8,1:1, orange 6,9:1,
  gul 8,8:1).
- **Som textfärg på vit botten fungerar bara** `brand-blue`, `brand-purple`,
  `brand-plum` (och `primary-500`/`600`/`700`). Teal/orange/gul/röd/rosa/sky
  används som ytor, märkesbakgrunder och dekor – inte som brödtextfärg.
- Tillgänglighet vinner alltid över profilen vid konflikt (se Avvikelser).

## 8. Komponentklasser (`src/index.css`, `@layer components`)

Alla interaktiva komponenter har hover-, fokus- (synlig ring i `primary-600` =
`#185DA9`) och inaktivt tillstånd, och klickbara ytor är minst 44 px höga
(`min-h-11`).

| Klass | Beskrivning |
|---|---|
| `.btn` | Basknapp: 44 px, PT Sans halvfet, fokusring, `disabled:opacity-50` |
| `.btn-primary` | Primärblå yta, vit text; hover `primary-700`, aktiv `primary-800` |
| `.btn-secondary` | Vit yta, linje, primärblå text; hover tonad blå |
| `.btn-ghost` | Transparent, dämpad text; hover tonad yta |
| `.btn-danger` | `error-strong` med vit text (4,5:1-säkrad) |
| `.link` | Primärblå halvfet länk, understrykning vid hover, fokusring |
| `.input` | 44 px fält, kant `surface-300`, fokus = blå kant + ring; inaktivt och platshållartillstånd |
| `.input-error` | Som `.input` men kantlinje i `error` (röd som ytmarkering, inte text) |
| `.label` | Halvfet etikett i `surface-700` |
| `.card` | Vit/mörkblå yta, radie `xl`, **endast border – aldrig skugga** |
| `.card-hover` | `.card` + blåtonad kant vid hover (ingen skugga) |
| `.badge` | Basmärke (rund, `text-xs` halvfet) |
| `.badge-primary` | Tonad blå + mörkblå text |
| `.badge-success` / `-warning` / `-error` | Tonad yta + mörk text i ljust läge; tonad yta + accentfärg i mörkt läge |
| `.badge-premium` | `brand-yellow` med mörk text (8,8:1) – premium/etiketter |
| `.dropdown-menu` | Flytande meny: border + skugga (flytande lager får ha skugga) |
| `.dropdown-item` | Menyrad, 44 px, hover/fokus-tillstånd |
| `.modal-overlay` | `surface-950/60` övertäckning |
| `.modal-content` | Vit/mörkblå panel med border + skugga |
| `.table-header` / `.table-row` / `.table-cell` | Tabell: tonat huvud, linjerade rader med hover |
| `.skeleton` | Pulserande platshållare i `surface-200`/`-700` |
| `.avatar(-sm/-md/-lg/-xl)` | Rund avatar 32/40/48/64 px |

Skuggregel: kort använder aldrig `shadow-*` (rättat i `.card` – tidigare
regelbrott). Skuggtokens (`shadow-soft/card/elevated`, nu blåtonade från
`#0E2A4D`) finns kvar och är reserverade för flytande lager (meny, modal).

## 9. När används vilken färg?

- **brand-blue / primary-600:** allt primärt – knappar, länkar, aktiv
  navigation, fokusring. Standardvalet.
- **brand-sky:** informationsytor, sekundär accent, `info`-status.
- **brand-teal:** bekräftelse/`success` – ytor och märken med mörk text.
- **brand-purple / brand-plum:** sparsamt – citat, kampanjer, evenemang.
- **brand-pink:** mycket sparsamt – dekor eller stor text, aldrig brödtext.
- **brand-red:** fel/varning som yta eller kantlinje (`error`); för knappar och
  text används härledningarna `error-strong`/`error-soft`.
- **brand-orange / brand-yellow:** premium och framhävning (`badge-premium`,
  premium-CTA) – alltid mörk text.
- **Övertoningarna:** hero, premium, avslutande CTA, citat – utvalda ytor.

## 10. Avvikelser från profilen

1. **`.btn-danger` använder `#B23327` (härledd mörkare brand-red), inte
   `#EC5345`.** Vit text på `#EC5345` ger 3,6:1 – underkänt för knapptext i
   liten storlek. Tillgänglighet vinner; `#EC5345` används fortsatt på ytor
   och kantlinjer.
2. **`error-soft` `#F49B92`** är en härledd ljus röd för feltext i mörkt läge
   (`#EC5345` ger bara 4,0:1 på mörkblå botten).
3. **Noto Nastaliq Urdu laddas inte längre** (Google Fonts-länken togs bort
   tillsammans med Inter). `.rtl-text` behåller typsnittsnamnet och faller
   tillbaka på systemets serif om typsnittet saknas lokalt. RTL-rendering blir
   enklare men fungerande; lokal @fontsource-paketering kan läggas till senare.
4. **Ciutadella ersätts av Barlow** tills licensfilerna finns – bytet är en
   fil-import, `--font-heading` är förberett.
5. **Fältkanter (`surface-300`, 1,7:1) når inte 3:1** för icke-textkontrast
   (WCAG 1.4.11). Kompenseras med tydligt fokus-tillstånd (blå kant + ring)
   och 44 px höjd; mörkare kanter över hela appen hade avvikit kraftigt från
   profilens ljusa linjefärg. `input-error`-kanten (`#EC5345`, 3,6:1) klarar
   kravet.
6. **`SiteSettingsContext` har kvar `#0ea5e9` som standard-primärfärg** och
   skriver över fallbackarna i körtid om databasen returnerar inställningar
   utan/med gammal `primary_color`. Filen får inte röras i fas 1 – sätt
   `primary_color = #185DA9` i webbplatsinställningarna, eller byt
   standardvärdet i fas 2.

## 11. Att göra i fas 2 (utanför denna fas)

- Migrera ~2 300 `dark:`-instanser och alla sidor till komponentklasserna.
- Ersätt kvarvarande `shadow-card`-användning på kortliknande ytor.
- Byt `DEFAULT_SETTINGS.primary_color` till `#185DA9` (logikfil, rördes inte).
- Eventuell lokal paketering av Noto Nastaliq Urdu för RTL.
