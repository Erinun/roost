# Uppdrag: bygg om plattformens gränssnitt enligt den grafiska profilen

Du är orkestrerare. Du ska leda en ombyggnad av hela plattformens presentationslager så att den följer Aktiespararnas grafiska profil 2023, och du ska lägga till en publik landningssida. Du skriver så lite kod som möjligt själv. Ditt jobb är att inventera, planera, dela upp arbetet på subagenter, granska det de lämnar och hålla ihop helheten.

Läs hela prompten innan du gör något.

## 1. Mål och avgränsning

**Målet** är att varje sida och komponent använder profilens färger, typsnitt och grafiska element på ett konsekvent sätt, och att det finns en landningssida på startadressen för utloggade besökare. I dag finns bara inloggningssidan.

**Det här får ändras:** färger, typografi, komponenternas utseende, avstånd, ikoner, layoutdetaljer, tomma lägen, laddnings- och feltillstånd, favicon och metadata.

**Det här får inte ändras:** affärslogik, datamodell, API:er, autentisering, behörigheter, betalflödets logik och befintliga adresser. Texter i gränssnittet lämnas som de är, utom på landningssidan. Plattformens namn byts inte.

Om en designändring kräver ändrad logik eller data: stanna och fråga mig.

Arbeta på en egen gren, `redesign/grafisk-profil`, med minst en commit per fas.

## 2. Underlag

Jag har lagt underlaget i repot. Saknas någon fil, säg till innan du går vidare.

- `docs/design/Grafisk_profil_2023.pdf` är den grafiska profilen och källan till sanning.
- `docs/design/landningssida-referens.md` är referenskoden för landningssidan, med anvisningar för hur den ska användas.
- `docs/design/landningssida-forslag.png` är en bild av samma förslag, om jag har lagt dit den.
- `docs/design/inloggning-nuvarande.png` visar inloggningssidan som den ser ut i dag.
- `public/brand/` innehåller originalfiler för logotyp och symbol, om jag har fått dem.

Alla värden från profilen står också i avsnitt 3, så att varje subagent kan få dem i sin brief.

## 3. Designspecifikation

### Färger

Använd hex-värdena. De är kontrollerade mot profilen.

| Namn i profilen | Hex | Roll i gränssnittet |
|---|---|---|
| primary-blue-400 | `#185DA9` | Primärfärg: primära knappar, länkar, aktiv navigation, fokusring |
| secondary-blue-400 | `#159EDA` | Sekundär accent, informationsytor, illustrationer |
| green-400 | `#32D7CD` | Accent och bekräftelse, alltid med mörk text |
| purple-700 | `#652FA0` | Sparsam accent: citat, kampanj- och evenemangsytor |
| purple-400 | `#973B8E` | Som ovan |
| pink-600 | `#EE0181` | Som ovan, bara stor text eller dekor |
| red-500 | `#EC5345` | Fel och varning på ytor, inte som textfärg |
| orange-400 | `#F5A118` | Premium och framhävning, alltid med mörk text |
| yellow-500 | `#FBC231` | Premium och etiketter, alltid med mörk text |

Två saker i PDF:en att känna till: RGB-värdet för pink-600 är felskrivet (138 ska vara 238, hex-värdet stämmer), och RGB skiljer sig ett steg från hex för primary-blue och orange. Hex gäller.

**Övertoningar.** Profilen arbetar med tre övertoningar mellan tre färger vardera:

- Blå: `#185DA9` → `#159EDA` → `#32D7CD`
- Lila: `#652FA0` → `#973B8E` → `#EE0181`
- Varm: `#EC5345` → `#F5A118` → `#FBC231`

Använd dem som ytor på utvalda ställen (hero, avslutande uppmaning, premium, citat), inte som bakgrund överallt.

**Neutraler.** Profilen definierar inga neutraler. Utgå från de här härledda värdena och dokumentera om du justerar dem: text `#0E2A4D`, dämpad text `#4A5B73`, linjer `#D5E1EE`, tonad yta `#F3F7FC`, vit `#FFFFFF`.

**Från dagens gränssnitt:** den gröna primärknappen och de gröna länkarna blir primärblå. Premiumytan behåller sin varma ton men byggs med den varma övertoningen och mörk text.

### Kontrast (uppmätt, WCAG 2.1)

Kravet är 4,5:1 för vanlig text och 3:1 för stor text (minst 24 px, eller 19 px fet).

- Vit text fungerar på primary-blue (6,6), purple-700 (8,5) och purple-400 (6,3).
- Vit text fungerar bara som stor text på pink-600 (4,2), red-500 (3,6) och secondary-blue (3,0).
- Vit text fungerar aldrig på green-400 (1,8), orange-400 (2,1) eller yellow-500 (1,6). Använd mörk text `#0E2A4D` där (8,1 / 6,9 / 8,8).
- Som textfärg på vit bakgrund fungerar bara primary-blue, purple-700 och purple-400. Profilen har orange rubriketiketter i tryck. Gör inte så med liten text på webben.
- Text på en övertoning får bara ligga över den del som klarar kravet.

Om profilen och tillgängligheten krockar vinner tillgängligheten. Skriv upp avvikelsen i slutrapporten.

### Typografi

Profilen använder tre typsnitt.

- **Ciutadella** för rubriker, och vid behov ingresser. Fet vikt. Stora rubriker på färgad yta sätts gärna i versaler, som på profilens omslag.
- **PT Sans** för underrubriker, korta texter och hela gränssnittet: knappar, formulär, menyer, etiketter.
- **PT Serif** för citat och längre löptext, till exempel artiklar och inlägg i läsläge.

Dagens typsnitt (Inter) tas bort helt.

Ciutadella är ett licensierat typsnitt. Leta efter fontfiler eller ett webbfont-kit i repot. Finns inget: använd Barlow som tillfällig ersättare via en enda CSS-variabel, så att bytet blir en rad, och ta upp det i slutrapporten. Hämta aldrig fontfiler från inofficiella källor. PT Sans och PT Serif har öppen licens. Lägg dem lokalt i projektet i stället för att ladda dem från en extern tjänst.

### Grafiska element och logotyp

- **Bården** är profilens sneda blå fält. Använd den som snedskuren kant på hero och avslutande uppmaning, i primärblått eller blå övertoning, med vitt innehåll. Inte i smala format.
- **A:et**, symbolen ur logotypen, får användas fristående i primärfärg eller vitt, eller med 15 % opacitet som bakgrundselement mot komplementfärgerna.
- **Logotypen** används bara från originalfilerna i `public/brand/`. Den får aldrig ritas om, roteras, ramas in eller få text intill sig, och gamla versioner används inte. Blå på vit bakgrund är förstahandsvalet, vit på färgad bakgrund, svart när färg inte går.
- Logotypen är varumärkesskyddad och kräver medgivande. Finns inga originalfiler i repot: lägg en tydlig platshållare och ta upp det i slutrapporten. Återskapa den aldrig själv.

## 4. Arbetsgång

### Fas 0: Inventering (endast läsning)

Starta två eller tre utforskande subagenter parallellt:

1. **Stack och styling.** Ramverk, hur stilar är uppbyggda (temafil, CSS-variabler, komponentbibliotek), hur typsnitt laddas och var färger definieras.
2. **Ytor.** Alla sidor och delade komponenter, grupperade i områden. Vad som händer på startadressen i dag för inloggade och utloggade.
3. **Avvikelser.** Hårdkodade färgvärden, inline-stilar, referenser till Inter, övertoningar och ikoner som inte går via temat.

Sammanställ resultatet i `docs/redesign/inventering.md`. Skriv sedan `docs/redesign/plan.md` med arbetspaket där **ingen fil ägs av mer än ett paket**.

**Stanna här och visa mig planen.** Fortsätt när jag har godkänt den.

### Fas 1: Designgrunden (en subagent, inget parallellt)

Allt annat bygger på den här fasen, så den görs klart först.

- Designtokens för färg, övertoningar, typografi, avstånd, radier och skuggor, inkopplade i projektets befintliga temalösning.
- Typsnitten installerade.
- Baskomponenterna omgjorda: knapp, länk, inmatningsfält, etikett, kort, flikar, märke, avisering, dialog, avatar och navigationsobjekt, med tillstånd för hovring, fokus, inaktiv och fel.
- `docs/redesign/designsystem.md` som beskriver tokens och när varje färg och komponent används.
- En intern sida, `/styleguide`, som visar alltihop.
- Inloggningssidan ombyggd som första riktiga sida.

**Stanna här och visa mig skärmbilder** av `/styleguide` och inloggningssidan i 390 och 1440 px bredd. Fortsätt när jag har godkänt.

### Fas 2: Ombyggnad per område (parallella subagenter)

En subagent per arbetspaket ur planen. Ett typiskt upplägg, som du anpassar efter inventeringen:

- A. Landningssidan (ny, se avsnitt 6)
- B. Skapa konto, glömt lösenord och premiumpanelen vid inloggning
- C. Appens skal: sidhuvud, meny, sidfot, tomma lägen, laddning, felsidor
- D. Flöde och grupper
- E. Direktmeddelanden
- F. Evenemang och exklusivt innehåll
- G. Premium och uppgradering (endast utseende)
- H. Profil, inställningar och admin
- I. E-postmallar, favicon, delningsbild och metadata

Regler för alla subagenter i fas 2:

- Använd bara tokens och komponenter från fas 1. Inga hårdkodade färger, inga egna typsnitt.
- Saknas en komponent eller token: rapportera till dig, bygg ingen lokal variant. Du låter då grundagenten lägga till den.
- Ändra bara filer som paketet äger.
- Ändra ingen logik.

### Fas 3: Granskning (subagenter som inte har byggt)

1. **Konsekvens.** Sök efter kvarvarande gamla färger, Inter och färgvärden utanför tokenfilen.
2. **Tillgänglighet.** Kontrast enligt avsnitt 3, synligt fokus, tangentbordsnavigering, etiketter på formulärfält, tryckytor på minst 44 px.
3. **Visuell kontroll.** Skärmbilder av varje sida i 390, 768 och 1440 px, jämförda mot designsystemet. Ingen vågrät rullning på mobil.
4. **Regression.** Bygge, lint, typkontroll och tester går igenom. Kontrollera med diffen att inga logik-, API- eller databasfiler har ändrats.

Skicka fynden till den subagent som äger filerna, och granska igen tills listan är tom.

## 5. Så skriver du en brief till en subagent

Subagenterna ser inte den här konversationen. Varje brief ska därför stå på egna ben och innehålla:

- målet med paketet och hur det ser ut när det är klart
- filerna paketet äger, och filer som får läsas men inte ändras
- hänvisning till `docs/redesign/designsystem.md` och de delar av avsnitt 3 som gäller
- förbuden: ingen logik, inga hårdkodade färger, inga filer utanför paketet
- vad som ska rapporteras tillbaka: ändrade filer, avvikelser från designsystemet med motivering, öppna frågor och sökvägar till skärmbilder

## 6. Landningssidan

Bygg efter `docs/design/landningssida-referens.md`. Läs anvisningarna överst i den filen först: koden är facit för struktur, texter och mått, men stilarna ska byggas med tokens och komponenter från fas 1, inte kopieras. Subagenten för landningssidan ska få hela filen i sin brief. Sidan visas på startadressen för utloggade besökare. Inloggade ska hamna där de hamnar i dag. Är det oklart hur det löses utan att röra autentiseringen: fråga mig.

Sidan har en enda primär handling, **Skapa konto gratis**, som upprepas nedåt på sidan och leder till det befintliga flödet för att skapa konto. Logga in är sekundär.

Sektioner uppifrån och ned:

1. **Sidhuvud:** logotyp, ankarlänkar (Det här får du, Medlemskap, Frågor och svar), Logga in, knappen Skapa konto.
2. **Hero** på blå övertoning med snedskuren nederkant: rubrik i versaler, ingress, de två knapparna och en skärmbild från plattformen.
3. **Det här får du som medlem:** tre kort (grupper, direktmeddelanden, exklusivt innehåll och evenemang). Premiumfunktioner märks med gul etikett.
4. **Kom igång i tre steg:** skapa gratiskonto, hitta dina grupper, uppgradera när du vill.
5. **Medlemskap:** Gratis och Premium sida vid sida. Premium får varm övertoning i kortets huvud.
6. **Citat** från en medlem, i PT Serif på lila övertoning.
7. **Frågor och svar.**
8. **Avslutande uppmaning** på primärblått med snedskuren överkant.
9. **Sidfot:** logotyp, villkor, integritetspolicy, kontakt.

Texterna tas från referenskoden. Allt inom hakparenteser, till exempel `[PRIS]`, är uppgifter jag inte har lämnat än. Låt dem stå kvar som synliga platshållare och lista dem i slutrapporten. Hitta inte på priser, citat, siffror eller villkor.

Sidan ska fungera från 360 px bredd och uppåt: kolumner staplas, menyn radbryts och inget rullar i sidled.

## 7. Klart när

- Alla sidor i inventeringen är ombyggda och granskade enligt fas 3.
- Inga gamla färger eller typsnitt finns kvar i koden.
- Landningssidan finns på startadressen och leder till det befintliga flödet för att skapa konto.
- Bygge, lint, typkontroll och tester går igenom.
- Diffen innehåller inga ändringar i logik, API eller databas.

**Slutrapporten** till mig ska innehålla: vad som ändrats per område, skärmbilder före och efter av de viktigaste sidorna, alla platshållare som återstår, avvikelser från profilen med motivering, och det som inte gick att göra.

## 8. Stanna och fråga mig när

- planen är klar (fas 0) och när designgrunden är klar (fas 1)
- en ändring skulle kräva ändrad logik, data eller autentisering
- logotypfiler eller typsnittslicens saknas och en platshållare inte räcker
- inventeringen visar något som gör ett arbetspaket riskabelt, till exempel stilar som är hårt sammanvävda med logiken
- två rimliga tolkningar av profilen ger tydligt olika resultat