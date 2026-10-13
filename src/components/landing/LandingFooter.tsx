import LogoPlaceholder from './LogoPlaceholder';

const footerLinkClass =
    'inline-flex min-h-11 items-center text-white no-underline hover:underline';

export default function LandingFooter() {
    return (
        <footer className="bg-surface-900 text-white">
            <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-8 gap-y-5 px-6 py-10">
                <div className="flex items-center gap-3">
                    <LogoPlaceholder tone="white" />
                    <span className="font-heading text-[22px] font-bold leading-none">Roost</span>
                </div>
                <nav aria-label="Sidfot" className="flex flex-wrap gap-x-7 gap-y-1">
                    <a href="#" className={footerLinkClass}>
                        [Villkor]
                    </a>
                    <a href="#" className={footerLinkClass}>
                        [Integritetspolicy]
                    </a>
                    <a href="#" className={footerLinkClass}>
                        [Kontakt]
                    </a>
                </nav>
                <div className="text-[15px] text-surface-200">© [ÅR] [ORGANISATION]</div>
            </div>
        </footer>
    );
}
