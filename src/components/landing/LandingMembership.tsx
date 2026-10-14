import { Link } from 'react-router-dom';

/**
 * Sektion för medlemmar i lokalavdelningarna (medlemsportalen).
 * Ersätter de tidigare priskorten (gratis/premium) – plattformen har
 * inga medlemskapsnivåer längre, bara ansökan om åtkomst.
 */
export default function LandingMembership() {
    return (
        <section id="medlemmar" className="bg-white">
            <div className="mx-auto max-w-[1160px] px-6 py-[88px]">
                <div className="flex flex-col items-start gap-5 rounded-2xl border border-surface-200 bg-surface-50 p-10">
                    <h2 className="text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.1] text-surface-900">
                        Är du medlem i en lokalavdelning?
                    </h2>
                    <p className="max-w-[720px] text-lg text-surface-600">
                        Medlemsportalen öppnas steg för steg. Där får du nyheter, evenemang och
                        information från din lokalavdelning. Ansök om åtkomst så återkommer vi när
                        din ansökan är godkänd.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex min-h-[52px] items-center rounded-[10px] bg-primary-600 px-7 text-lg font-bold text-white no-underline hover:bg-primary-700 active:bg-primary-800"
                    >
                        Ansök som medlem
                    </Link>
                </div>
            </div>
        </section>
    );
}
