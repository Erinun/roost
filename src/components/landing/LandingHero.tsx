import { Link } from 'react-router-dom';

// Snedskuren nederkant enligt referensen – ren geometri (inga färger).
const heroClipPath =
    'polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - clamp(32px, 5vw, 72px)))';

export default function LandingHero() {
    return (
        <section
            // Radiell övertoning från nedre högra hörnet (teal → sky → blå) så att
            // texten till vänster ligger på primärblått. Byggd på CSS-variabler.
            className="bg-[radial-gradient(85%_75%_at_100%_100%,var(--brand-teal)_0%,var(--brand-sky)_30%,var(--brand-blue)_68%)] text-white"
            style={{ clipPath: heroClipPath }}
        >
            <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-16 gap-y-12 px-6 pb-[136px] pt-[88px]">
                <div className="flex min-w-0 flex-[1_1_440px] flex-col items-start gap-6">
                    <div className="text-sm font-bold uppercase tracking-[0.12em] text-primary-100">
                        Community-plattform
                    </div>
                    <h1 className="text-[clamp(40px,5.6vw,76px)] font-extrabold uppercase leading-[1.02] tracking-[0.01em] text-white [text-wrap:balance]">
                        Där sparare blir klokare tillsammans
                    </h1>
                    <p className="max-w-[520px] text-xl leading-[1.5]">
                        I Roost diskuterar du aktier och sparande med andra medlemmar, går med i
                        grupper som matchar dina intressen och hänger med på evenemang. Kom igång
                        med ett gratiskonto och uppgradera när du vill.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            to="/signup"
                            className="inline-flex min-h-[52px] items-center rounded-[10px] bg-white px-7 text-lg font-bold text-primary-600 no-underline hover:bg-primary-50"
                        >
                            Skapa konto gratis
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex min-h-[52px] items-center rounded-[10px] border-2 border-white px-7 text-lg font-bold text-white no-underline hover:bg-white/10"
                        >
                            Logga in
                        </Link>
                    </div>
                </div>
                <div className="min-w-0 flex-[1_1_380px]">
                    {/* Flytande/presenterande panel – enda ytan med skugga (shadow-elevated) */}
                    <div className="rounded-2xl bg-white p-3.5 shadow-elevated">
                        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-surface-300 bg-surface-50 p-6 text-center text-surface-600">
                            <svg
                                aria-hidden="true"
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary-600"
                            >
                                <rect x="3" y="4.5" width="18" height="15" rx="2"></rect>
                                <path d="M3 15.5l5-4.5 4.5 4 3-2.5 5.5 4.5"></path>
                                <circle cx="15.5" cy="9" r="1.5"></circle>
                            </svg>
                            <div className="font-bold text-surface-900">
                                [SKÄRMBILD FRÅN PLATTFORMEN]
                            </div>
                            <div className="text-[15px]">
                                Till exempel flödet eller en grupp i inloggat läge
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
