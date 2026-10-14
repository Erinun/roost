interface FaqItemProps {
    question: string;
    answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-surface-200 bg-white px-7 py-6">
            {/* FAQ-rubrikerna sätts i brödtypsnittet enligt referensen */}
            <h3 className="font-sans text-xl font-bold leading-[1.3] text-surface-900">
                {question}
            </h3>
            <p className="text-surface-600">{answer}</p>
        </div>
    );
}

export default function LandingFaq() {
    return (
        <section id="fragor" className="bg-surface-50">
            <div className="mx-auto flex max-w-[1160px] flex-col gap-10 px-6 pb-[152px] pt-[88px]">
                <h2 className="text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.1] text-surface-900">
                    Frågor och svar
                </h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-5">
                    <FaqItem
                        question="Vem kan få åtkomst?"
                        answer="I första hand ledamöter i lokalavdelningarnas ledningsgrupper. Medlemmar kan också ansöka om åtkomst till medlemsportalen."
                    />
                    <FaqItem
                        question="Hur får jag inloggningsuppgifter?"
                        answer="Du fyller i ansökningsformuläret. När vi har godkänt ansökan får du dina uppgifter via mejl."
                    />
                    <FaqItem
                        question="Vad ser medlemmarna?"
                        answer="Medlemmarna ser sin egen lokalavdelning och det som delas med dem. Ledningsgruppernas gemensamma utrymme är bara för ledningsgrupperna."
                    />
                    <FaqItem
                        question="Kostar det något?"
                        answer="[Fyll i enligt ert beslut]"
                    />
                </div>
            </div>
        </section>
    );
}
