import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

function CheckItem({ children }: { children: ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0 text-primary-600"
            >
                <path d="M5 12.5l4.5 4.5L19 7.5"></path>
            </svg>
            <span>{children}</span>
        </li>
    );
}

const ctaClass =
    'flex min-h-[52px] items-center justify-center rounded-[10px] bg-primary-600 px-7 text-lg font-bold text-white no-underline hover:bg-primary-700 active:bg-primary-800';

export default function LandingMembership() {
    return (
        <section id="medlemskap" className="bg-white">
            <div className="mx-auto flex max-w-[1160px] flex-col gap-10 px-6 py-[88px]">
                <h2 className="text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.1] text-surface-900">
                    Välj det medlemskap som passar dig
                </h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-stretch gap-6">
                    {/* Gratis */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white">
                        <div className="bg-surface-100 px-8 py-6">
                            <h3 className="text-[30px] font-bold leading-[1.1] text-surface-900">
                                Gratis
                            </h3>
                        </div>
                        <div className="flex grow flex-col gap-6 p-8">
                            <div className="flex flex-col gap-1">
                                <div className="font-heading text-[40px] font-bold leading-[1.1] text-surface-900">
                                    0 kr
                                </div>
                                <p className="text-surface-600">
                                    För dig som vill börja utforska communityt.
                                </p>
                            </div>
                            <ul className="flex grow list-none flex-col gap-3 p-0">
                                <CheckItem>[FUNKTION I GRATISVERSIONEN]</CheckItem>
                                <CheckItem>[FUNKTION I GRATISVERSIONEN]</CheckItem>
                                <CheckItem>[FUNKTION I GRATISVERSIONEN]</CheckItem>
                            </ul>
                            <Link to="/signup" className={ctaClass}>
                                Skapa konto gratis
                            </Link>
                        </div>
                    </div>

                    {/* Premium */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-brand-orange bg-white">
                        {/* Varm övertoning med MÖRK text (kontrastregel: aldrig vit text på gult/orange) */}
                        <div className="bg-gradient-warm px-8 py-6">
                            <h3 className="text-[30px] font-bold leading-[1.1] text-surface-900">
                                Premium
                            </h3>
                        </div>
                        <div className="flex grow flex-col gap-6 p-8">
                            <div className="flex flex-col gap-1">
                                <div className="font-heading text-[40px] font-bold leading-[1.1] text-surface-900">
                                    [PRIS] kr/mån
                                </div>
                                <p className="text-surface-600">
                                    Lås upp alla funktioner och exklusivt innehåll.
                                </p>
                            </div>
                            <ul className="flex grow list-none flex-col gap-3 p-0">
                                <CheckItem>
                                    <span className="font-bold">Allt i gratisversionen</span>
                                </CheckItem>
                                <CheckItem>Direktmeddelanden med medlemmar</CheckItem>
                                <CheckItem>Åtkomst till premiumgrupper</CheckItem>
                                <CheckItem>Prioriterad support</CheckItem>
                                <CheckItem>Exklusivt innehåll och evenemang</CheckItem>
                            </ul>
                            <div className="flex flex-col gap-3">
                                <Link to="/signup" className={ctaClass}>
                                    Skapa konto gratis
                                </Link>
                                <p className="text-center text-[15px] text-surface-600">
                                    Du uppgraderar till premium inifrån ditt konto, när du vill.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
