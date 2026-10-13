import { Link } from 'react-router-dom';

export default function LandingCta() {
    return (
        <section
            // Linjär blå övertoning byggd på CSS-variabler (brand-blue → brand-sky,
            // med slutstoppet utanför ytan så högerkanten stannar nära primärblått).
            className="bg-[linear-gradient(90deg,var(--brand-blue)_0%,var(--brand-blue)_55%,var(--brand-sky)_130%)] text-white"
            // Snedskuren överkant + negativ marginal med samma mått (ren geometri).
            style={{
                marginTop: 'calc(-1 * clamp(32px, 5vw, 72px))',
                clipPath: 'polygon(0 clamp(32px, 5vw, 72px), 100% 0, 100% 100%, 0 100%)',
            }}
        >
            <div className="mx-auto flex max-w-[880px] flex-col items-center gap-5 px-6 pb-[88px] pt-[152px] text-center">
                <h2 className="text-[clamp(34px,4.4vw,56px)] font-extrabold uppercase leading-[1.05] tracking-[0.01em] text-white [text-wrap:balance]">
                    Gå med i communityt i dag
                </h2>
                <p className="text-xl">Skapa ett gratiskonto och uppgradera när du vill.</p>
                <Link
                    to="/signup"
                    className="mt-2 inline-flex min-h-[52px] items-center rounded-[10px] bg-white px-8 text-lg font-bold text-primary-600 no-underline hover:bg-primary-50"
                >
                    Skapa konto gratis
                </Link>
                <p>
                    Har du redan ett konto?{' '}
                    <Link to="/login" className="font-bold text-white hover:underline">
                        Logga in
                    </Link>
                </p>
            </div>
        </section>
    );
}
