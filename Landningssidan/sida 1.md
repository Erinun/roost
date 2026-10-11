# Landningssida: referenskod

Det här är referensen för landningssidan i ombyggnaden. Koden är en fristående HTML-sida som går att öppna direkt i en webbläsare. Den visar struktur, texter, ordning, mått och färgval. Den är inte tänkt att klistras in som den är.

## Så används referensen

- **Det här gäller som facit:** sektionernas ordning, rubriker och texter, proportioner, avstånd, radier och vilka färger som används var.
- **Det här ska översättas:** alla inline-stilar byggs om med projektets tokens och komponenter enligt `docs/redesign/designsystem.md`. Inga färgvärden hårdkodas i den färdiga sidan.
- **Typsnitt:** rubrikerna anger `Ciutadella` först och `Barlow` som ersättare. Länken till Google Fonts finns bara för att referensen ska gå att öppna. I projektet läggs typsnitten lokalt.
- **Länkar:** alla `href="#"` kopplas till befintliga flöden. Skapa konto och Skapa konto gratis leder till registreringen, Logga in till inloggningen. Ankarlänkarna (`#fordelar`, `#medlemskap`, `#fragor`) behålls.
- **Logotyp:** rutorna märkta `LOGO` ersätts med originalfilen från `public/brand/`. Finns ingen fil står platshållaren kvar.
- **Platshållare:** allt inom hakparenteser, till exempel `[PRIS]`, är uppgifter som saknas. De står kvar synliga tills de har lämnats och listas i slutrapporten.
- **Skärmbilden i hero:** den streckade rutan ersätts med en riktig skärmbild från plattformen i inloggat läge.

## Det som är lätt att missa

- De sneda kanterna på hero och avslutande uppmaning görs med `clip-path` och krymper på små skärmar via `clamp(32px, 5vw, 72px)`. Den avslutande sektionen dras upp över föregående med samma mått som negativ marginal.
- Heros övertoning är radiell från nedre högra hörnet, så att texten till vänster alltid ligger på primärblått och klarar kontrastkravet. Behåll den principen om övertoningen görs om.
- Kolumnerna använder `repeat(auto-fit, minmax(min(…px, 100%), 1fr))` och staplas därför av sig själva på smala skärmar, utan brytpunkter.
- Text på gult och orange är alltid mörk (`#0E2A4D`). Vit text används bara på blått och lila.
- Alla klickbara ytor är minst 44 px höga.

## Kod

```html
<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Roost – community-plattform</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@600;700;800&amp;family=PT+Sans:ital,wght@0,400;0,700;1,400&amp;family=PT+Serif:ital,wght@0,400;1,400&amp;display=swap">
<style>
body{margin:0}
a{color:#185DA9}a:hover{color:#0E2A4D}
</style>
</head>
<body>
<div style="font-family: 'PT Sans', system-ui, sans-serif; font-size: 17px; line-height: 1.55; color: #0E2A4D; background: #FFFFFF">

<header style="background: #FFFFFF; border-bottom: 1px solid #D5E1EE">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 16px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 32px">
<a href="#" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: #0E2A4D">
<span aria-hidden="true" style="width: 44px; height: 44px; box-sizing: border-box; border: 2px dashed #185DA9; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: #185DA9">LOGO</span>
<span style="font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 26px; line-height: 1">Roost</span>
</a>
<nav aria-label="Huvudmeny" style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 28px">
<a href="#fordelar" style="min-height: 44px; display: inline-flex; align-items: center; font-weight: 700; text-decoration: none; color: #0E2A4D">Det här får du</a>
<a href="#medlemskap" style="min-height: 44px; display: inline-flex; align-items: center; font-weight: 700; text-decoration: none; color: #0E2A4D">Medlemskap</a>
<a href="#fragor" style="min-height: 44px; display: inline-flex; align-items: center; font-weight: 700; text-decoration: none; color: #0E2A4D">Frågor och svar</a>
</nav>
<div style="display: flex; align-items: center; gap: 8px">
<a href="#" style="min-height: 44px; display: inline-flex; align-items: center; padding: 0 14px; font-weight: 700; text-decoration: none; color: #185DA9">Logga in</a>
<a href="#" style="min-height: 44px; display: inline-flex; align-items: center; padding: 0 20px; border-radius: 10px; background: #185DA9; color: #FFFFFF; font-weight: 700; text-decoration: none">Skapa konto</a>
</div>
</div>
</header>

<main>

<section style="background: radial-gradient(85% 75% at 100% 100%, #32D7CD 0%, #159EDA 30%, #185DA9 68%); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - clamp(32px, 5vw, 72px))); color: #FFFFFF">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 88px 24px 136px; display: flex; flex-wrap: wrap; align-items: center; gap: 48px 64px">
<div style="flex: 1 1 440px; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 24px">
<div style="font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #E3F0FA">Community-plattform</div>
<h1 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 800; font-size: clamp(40px, 5.6vw, 76px); line-height: 1.02; letter-spacing: 0.01em; text-transform: uppercase; text-wrap: balance">Där sparare blir klokare tillsammans</h1>
<p style="margin: 0; max-width: 520px; font-size: 20px; line-height: 1.5">I Roost diskuterar du aktier och sparande med andra medlemmar, går med i grupper som matchar dina intressen och hänger med på evenemang. Kom igång med ett gratiskonto och uppgradera när du vill.</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px; padding-top: 8px">
<a href="#" style="min-height: 52px; display: inline-flex; align-items: center; padding: 0 28px; border-radius: 10px; background: #FFFFFF; color: #185DA9; font-size: 18px; font-weight: 700; text-decoration: none">Skapa konto gratis</a>
<a href="#" style="min-height: 52px; box-sizing: border-box; display: inline-flex; align-items: center; padding: 0 28px; border-radius: 10px; border: 2px solid #FFFFFF; color: #FFFFFF; font-size: 18px; font-weight: 700; text-decoration: none">Logga in</a>
</div>
</div>
<div style="flex: 1 1 380px; min-width: 0">
<div style="background: #FFFFFF; border-radius: 16px; padding: 14px; box-shadow: 0 24px 60px rgba(14, 42, 77, 0.28)">
<div style="aspect-ratio: 4 / 3; box-sizing: border-box; border: 2px dashed #9DB7D3; border-radius: 10px; background: #F3F7FC; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; text-align: center; color: #4A5B73">
<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2"></rect><path d="M3 15.5l5-4.5 4.5 4 3-2.5 5.5 4.5"></path><circle cx="15.5" cy="9" r="1.5"></circle></svg>
<div style="font-weight: 700; color: #0E2A4D">[SKÄRMBILD FRÅN PLATTFORMEN]</div>
<div style="font-size: 15px">Till exempel flödet eller en grupp i inloggat läge</div>
</div>
</div>
</div>
</div>
</section>

<section id="fordelar" style="background: #FFFFFF">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 72px 24px 88px; display: flex; flex-direction: column; gap: 40px">
<h2 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.1">Det här får du som medlem</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 24px">

<div style="border: 1px solid #D5E1EE; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; align-items: flex-start; gap: 14px">
<div aria-hidden="true" style="width: 52px; height: 52px; border-radius: 12px; background: #EAF2FA; display: flex; align-items: center; justify-content: center">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"></path><circle cx="17.5" cy="9" r="2.5"></circle><path d="M17 14.2c2.6.3 4.5 2.3 4.5 5.3"></path></svg>
</div>
<h3 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 24px; line-height: 1.2">Grupper för det du är nyfiken på</h3>
<p style="margin: 0; color: #4A5B73">Gå med i grupper och diskutera med andra medlemmar. Med premium öppnas även premiumgrupperna.</p>
</div>

<div style="border: 1px solid #D5E1EE; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; align-items: flex-start; gap: 14px">
<div aria-hidden="true" style="width: 52px; height: 52px; border-radius: 12px; background: #EAF2FA; display: flex; align-items: center; justify-content: center">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5z"></path><path d="M8 9.5h8M8 12.5h5"></path></svg>
</div>
<h3 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 24px; line-height: 1.2">Direktkontakt med andra medlemmar</h3>
<p style="margin: 0; color: #4A5B73">Skicka direktmeddelanden till medlemmar du vill prata vidare med.</p>
<span style="padding: 4px 12px; border-radius: 999px; background: #FBC231; color: #0E2A4D; font-size: 14px; font-weight: 700">Premium</span>
</div>

<div style="border: 1px solid #D5E1EE; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; align-items: flex-start; gap: 14px">
<div aria-hidden="true" style="width: 52px; height: 52px; border-radius: 12px; background: #EAF2FA; display: flex; align-items: center; justify-content: center">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path></svg>
</div>
<h3 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 24px; line-height: 1.2">Innehåll och evenemang bara för medlemmar</h3>
<p style="margin: 0; color: #4A5B73">Som premiummedlem får du exklusivt innehåll och evenemang, och prioriterad support när du behöver hjälp.</p>
<span style="padding: 4px 12px; border-radius: 999px; background: #FBC231; color: #0E2A4D; font-size: 14px; font-weight: 700">Premium</span>
</div>

</div>
</div>
</section>

<section style="background: #F3F7FC">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 72px 24px; display: flex; flex-direction: column; gap: 40px">
<h2 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.1">Kom igång i tre steg</h2>
<ol style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 32px">
<li style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
<span aria-hidden="true" style="width: 52px; height: 52px; border-radius: 50%; background: #185DA9; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 26px">1</span>
<h3 style="margin: 0; font-size: 21px; font-weight: 700; line-height: 1.25">Skapa ett gratiskonto</h3>
<p style="margin: 0; color: #4A5B73">Det kostar ingenting att komma igång.</p>
</li>
<li style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
<span aria-hidden="true" style="width: 52px; height: 52px; border-radius: 50%; background: #185DA9; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 26px">2</span>
<h3 style="margin: 0; font-size: 21px; font-weight: 700; line-height: 1.25">Hitta dina grupper</h3>
<p style="margin: 0; color: #4A5B73">Gå med i de grupper som passar dig och börja följa samtalen.</p>
</li>
<li style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
<span aria-hidden="true" style="width: 52px; height: 52px; border-radius: 50%; background: #185DA9; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 26px">3</span>
<h3 style="margin: 0; font-size: 21px; font-weight: 700; line-height: 1.25">Uppgradera när du vill</h3>
<p style="margin: 0; color: #4A5B73">Vill du ha direktmeddelanden, premiumgrupper och exklusiva evenemang byter du till premium.</p>
</li>
</ol>
</div>
</section>

<section id="medlemskap" style="background: #FFFFFF">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 88px 24px; display: flex; flex-direction: column; gap: 40px">
<h2 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.1">Välj det medlemskap som passar dig</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 24px; align-items: stretch">

<div style="border: 1px solid #D5E1EE; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column">
<div style="background: #EAF2FA; padding: 24px 32px">
<h3 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 30px; line-height: 1.1">Gratis</h3>
</div>
<div style="padding: 32px; display: flex; flex-direction: column; gap: 24px; flex-grow: 1">
<div style="display: flex; flex-direction: column; gap: 4px">
<div style="font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 40px; line-height: 1.1">0 kr</div>
<p style="margin: 0; color: #4A5B73">För dig som vill börja utforska communityt.</p>
</div>
<ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; flex-grow: 1">
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>[FUNKTION I GRATISVERSIONEN]</span></li>
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>[FUNKTION I GRATISVERSIONEN]</span></li>
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>[FUNKTION I GRATISVERSIONEN]</span></li>
</ul>
<a href="#" style="min-height: 52px; display: flex; align-items: center; justify-content: center; padding: 0 28px; border-radius: 10px; background: #185DA9; color: #FFFFFF; font-size: 18px; font-weight: 700; text-decoration: none">Skapa konto gratis</a>
</div>
</div>

<div style="border: 2px solid #F5A118; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column">
<div style="background: linear-gradient(100deg, #EC5345 -20%, #F5A118 45%, #FBC231 100%); padding: 24px 32px">
<h3 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 30px; line-height: 1.1; color: #0E2A4D">Premium</h3>
</div>
<div style="padding: 32px; display: flex; flex-direction: column; gap: 24px; flex-grow: 1">
<div style="display: flex; flex-direction: column; gap: 4px">
<div style="font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 40px; line-height: 1.1">[PRIS] kr/mån</div>
<p style="margin: 0; color: #4A5B73">Lås upp alla funktioner och exklusivt innehåll.</p>
</div>
<ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; flex-grow: 1">
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span style="font-weight: 700">Allt i gratisversionen</span></li>
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>Direktmeddelanden med medlemmar</span></li>
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>Åtkomst till premiumgrupper</span></li>
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>Prioriterad support</span></li>
<li style="display: flex; gap: 12px; align-items: flex-start"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185DA9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>Exklusivt innehåll och evenemang</span></li>
</ul>
<div style="display: flex; flex-direction: column; gap: 12px">
<a href="#" style="min-height: 52px; display: flex; align-items: center; justify-content: center; padding: 0 28px; border-radius: 10px; background: #185DA9; color: #FFFFFF; font-size: 18px; font-weight: 700; text-decoration: none">Skapa konto gratis</a>
<p style="margin: 0; font-size: 15px; text-align: center; color: #4A5B73">Du uppgraderar till premium inifrån ditt konto, när du vill.</p>
</div>
</div>
</div>

</div>
</div>
</section>

<section style="background: linear-gradient(100deg, #652FA0 0%, #973B8E 70%, #EE0181 130%); color: #FFFFFF">
<figure style="max-width: 880px; margin: 0 auto; box-sizing: border-box; padding: 80px 24px; display: flex; flex-direction: column; gap: 24px">
<blockquote style="margin: 0; font-family: 'PT Serif', Georgia, serif; font-style: italic; font-size: clamp(24px, 2.6vw, 32px); line-height: 1.4; text-wrap: pretty">”[CITAT FRÅN EN MEDLEM: en eller två meningar om vad communityt har gett.]”</blockquote>
<figcaption style="font-weight: 700; letter-spacing: 0.04em">[NAMN, MEDLEM SEDAN ÅR]</figcaption>
</figure>
</section>

<section id="fragor" style="background: #F3F7FC">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 88px 24px 152px; display: flex; flex-direction: column; gap: 40px">
<h2 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.1">Frågor och svar</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr)); gap: 20px">
<div style="background: #FFFFFF; border: 1px solid #D5E1EE; border-radius: 12px; padding: 24px 28px; display: flex; flex-direction: column; gap: 8px">
<h3 style="margin: 0; font-size: 20px; font-weight: 700; line-height: 1.3">Kostar det något att gå med?</h3>
<p style="margin: 0; color: #4A5B73">Nej. Du skapar ett gratiskonto och kan uppgradera till premium när du vill.</p>
</div>
<div style="background: #FFFFFF; border: 1px solid #D5E1EE; border-radius: 12px; padding: 24px 28px; display: flex; flex-direction: column; gap: 8px">
<h3 style="margin: 0; font-size: 20px; font-weight: 700; line-height: 1.3">Vad ingår i premium?</h3>
<p style="margin: 0; color: #4A5B73">Allt i gratisversionen, plus direktmeddelanden med medlemmar, åtkomst till premiumgrupper, prioriterad support och exklusivt innehåll och evenemang.</p>
</div>
<div style="background: #FFFFFF; border: 1px solid #D5E1EE; border-radius: 12px; padding: 24px 28px; display: flex; flex-direction: column; gap: 8px">
<h3 style="margin: 0; font-size: 20px; font-weight: 700; line-height: 1.3">Vad kostar premium?</h3>
<p style="margin: 0; color: #4A5B73">[PRIS OCH BETALNINGSPERIOD]</p>
</div>
<div style="background: #FFFFFF; border: 1px solid #D5E1EE; border-radius: 12px; padding: 24px 28px; display: flex; flex-direction: column; gap: 8px">
<h3 style="margin: 0; font-size: 20px; font-weight: 700; line-height: 1.3">Kan jag säga upp premium när jag vill?</h3>
<p style="margin: 0; color: #4A5B73">[UPPSÄGNINGSVILLKOR]</p>
</div>
</div>
</div>
</section>

<section style="margin-top: calc(-1 * clamp(32px, 5vw, 72px)); background: linear-gradient(90deg, #185DA9 0%, #185DA9 55%, #1779C2 100%); clip-path: polygon(0 clamp(32px, 5vw, 72px), 100% 0, 100% 100%, 0 100%); color: #FFFFFF">
<div style="max-width: 880px; margin: 0 auto; box-sizing: border-box; padding: 152px 24px 88px; display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center">
<h2 style="margin: 0; font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 800; font-size: clamp(34px, 4.4vw, 56px); line-height: 1.05; text-transform: uppercase; letter-spacing: 0.01em; text-wrap: balance">Gå med i communityt i dag</h2>
<p style="margin: 0; font-size: 20px">Skapa ett gratiskonto och uppgradera när du vill.</p>
<a href="#" style="margin-top: 8px; min-height: 52px; display: inline-flex; align-items: center; padding: 0 32px; border-radius: 10px; background: #FFFFFF; color: #185DA9; font-size: 18px; font-weight: 700; text-decoration: none">Skapa konto gratis</a>
<p style="margin: 0">Har du redan ett konto? <a href="#" style="color: #FFFFFF; font-weight: 700">Logga in</a></p>
</div>
</section>

</main>

<footer style="background: #0E2A4D; color: #FFFFFF">
<div style="max-width: 1160px; margin: 0 auto; box-sizing: border-box; padding: 40px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px 32px">
<div style="display: flex; align-items: center; gap: 12px">
<span aria-hidden="true" style="width: 44px; height: 44px; box-sizing: border-box; border: 2px dashed #FFFFFF; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; letter-spacing: 0.06em">LOGO</span>
<span style="font-family: Ciutadella, Barlow, 'PT Sans', sans-serif; font-weight: 700; font-size: 22px; line-height: 1">Roost</span>
</div>
<nav aria-label="Sidfot" style="display: flex; flex-wrap: wrap; gap: 4px 28px">
<a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: #FFFFFF">[Villkor]</a>
<a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: #FFFFFF">[Integritetspolicy]</a>
<a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: #FFFFFF">[Kontakt]</a>
</nav>
<div style="font-size: 15px; color: #D6E8F7">© [ÅR] [ORGANISATION]</div>
</div>
</footer>

</div>
</body>
</html>
```