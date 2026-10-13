import type { ReactNode } from 'react';

interface BenefitCardProps {
    icon: ReactNode;
    title: string;
    text: string;
    premium?: boolean;
}

function BenefitCard({ icon, title, text, premium = false }: BenefitCardProps) {
    return (
        <div className="flex flex-col items-start gap-3.5 rounded-2xl border border-surface-200 bg-white p-7">
            <div
                aria-hidden="true"
                className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface-100 text-primary-600"
            >
                {icon}
            </div>
            <h3 className="text-2xl font-bold leading-[1.2] text-surface-900">{title}</h3>
            <p className="text-surface-600">{text}</p>
            {premium && <span className="badge-premium px-3 py-1 text-sm">Premium</span>}
        </div>
    );
}

const iconProps = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
} as const;

export default function LandingBenefits() {
    return (
        <section id="fordelar" className="bg-white">
            <div className="mx-auto flex max-w-[1160px] flex-col gap-10 px-6 pb-[88px] pt-[72px]">
                <h2 className="text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.1] text-surface-900">
                    Det här får du som medlem
                </h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
                    <BenefitCard
                        icon={
                            <svg {...iconProps}>
                                <circle cx="9" cy="8" r="3.5"></circle>
                                <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"></path>
                                <circle cx="17.5" cy="9" r="2.5"></circle>
                                <path d="M17 14.2c2.6.3 4.5 2.3 4.5 5.3"></path>
                            </svg>
                        }
                        title="Grupper för det du är nyfiken på"
                        text="Gå med i grupper och diskutera med andra medlemmar. Med premium öppnas även premiumgrupperna."
                    />
                    <BenefitCard
                        icon={
                            <svg {...iconProps}>
                                <path d="M4 5h16v11H9l-5 4V5z"></path>
                                <path d="M8 9.5h8M8 12.5h5"></path>
                            </svg>
                        }
                        title="Direktkontakt med andra medlemmar"
                        text="Skicka direktmeddelanden till medlemmar du vill prata vidare med."
                        premium
                    />
                    <BenefitCard
                        icon={
                            <svg {...iconProps}>
                                <rect x="3.5" y="5" width="17" height="15" rx="2"></rect>
                                <path d="M3.5 10h17M8 3v4M16 3v4"></path>
                            </svg>
                        }
                        title="Innehåll och evenemang bara för medlemmar"
                        text="Som premiummedlem får du exklusivt innehåll och evenemang, och prioriterad support när du behöver hjälp."
                        premium
                    />
                </div>
            </div>
        </section>
    );
}
