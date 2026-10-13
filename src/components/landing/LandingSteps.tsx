interface StepItemProps {
    number: string;
    title: string;
    text: string;
}

function StepItem({ number, title, text }: StepItemProps) {
    return (
        <li className="flex flex-col items-start gap-3">
            <span
                aria-hidden="true"
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary-600 font-heading text-[26px] font-bold text-white"
            >
                {number}
            </span>
            {/* Steg-rubrikerna sätts i brödtypsnittet enligt referensen */}
            <h3 className="font-sans text-[21px] font-bold leading-[1.25] text-surface-900">
                {title}
            </h3>
            <p className="text-surface-600">{text}</p>
        </li>
    );
}

export default function LandingSteps() {
    return (
        <section className="bg-surface-50">
            <div className="mx-auto flex max-w-[1160px] flex-col gap-10 px-6 py-[72px]">
                <h2 className="text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.1] text-surface-900">
                    Kom igång i tre steg
                </h2>
                <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-8 p-0">
                    <StepItem
                        number="1"
                        title="Skapa ett gratiskonto"
                        text="Det kostar ingenting att komma igång."
                    />
                    <StepItem
                        number="2"
                        title="Hitta dina grupper"
                        text="Gå med i de grupper som passar dig och börja följa samtalen."
                    />
                    <StepItem
                        number="3"
                        title="Uppgradera när du vill"
                        text="Vill du ha direktmeddelanden, premiumgrupper och exklusiva evenemang byter du till premium."
                    />
                </ol>
            </div>
        </section>
    );
}
