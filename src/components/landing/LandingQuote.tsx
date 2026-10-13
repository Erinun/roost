export default function LandingQuote() {
    return (
        <section className="bg-gradient-purple text-white">
            <figure className="mx-auto flex max-w-[880px] flex-col gap-6 px-6 py-20">
                <blockquote className="font-serif text-[clamp(24px,2.6vw,32px)] italic leading-[1.4] [text-wrap:pretty]">
                    ”[CITAT FRÅN EN MEDLEM: en eller två meningar om vad communityt har
                    gett.]”
                </blockquote>
                <figcaption className="font-bold tracking-[0.04em]">
                    [NAMN, MEDLEM SEDAN ÅR]
                </figcaption>
            </figure>
        </section>
    );
}
