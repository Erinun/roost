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
                        question="Kostar det något att gå med?"
                        answer="Nej. Du skapar ett gratiskonto och kan uppgradera till premium när du vill."
                    />
                    <FaqItem
                        question="Vad ingår i premium?"
                        answer="Allt i gratisversionen, plus direktmeddelanden med medlemmar, åtkomst till premiumgrupper, prioriterad support och exklusivt innehåll och evenemang."
                    />
                    <FaqItem
                        question="Vad kostar premium?"
                        answer="[PRIS OCH BETALNINGSPERIOD]"
                    />
                    <FaqItem
                        question="Kan jag säga upp premium när jag vill?"
                        answer="[UPPSÄGNINGSVILLKOR]"
                    />
                </div>
            </div>
        </section>
    );
}
