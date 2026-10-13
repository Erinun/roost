import { Link } from 'react-router-dom';
import LogoPlaceholder from './LogoPlaceholder';

const navLinkClass =
    'inline-flex min-h-11 items-center font-bold text-surface-900 no-underline hover:text-primary-700';

export default function LandingHeader() {
    return (
        <header className="border-b border-surface-200 bg-white">
            <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
                <Link to="/" className="flex items-center gap-3 text-surface-900 no-underline">
                    <LogoPlaceholder tone="blue" />
                    <span className="font-heading text-[26px] font-bold leading-none">Roost</span>
                </Link>
                <nav aria-label="Huvudmeny" className="flex flex-wrap items-center gap-x-7 gap-y-1">
                    <a href="#fordelar" className={navLinkClass}>
                        Det här får du
                    </a>
                    <a href="#medlemskap" className={navLinkClass}>
                        Medlemskap
                    </a>
                    <a href="#fragor" className={navLinkClass}>
                        Frågor och svar
                    </a>
                </nav>
                <div className="flex items-center gap-2">
                    <Link
                        to="/login"
                        className="inline-flex min-h-11 items-center px-3.5 font-bold text-primary-600 no-underline hover:text-primary-700"
                    >
                        Logga in
                    </Link>
                    <Link
                        to="/signup"
                        className="inline-flex min-h-11 items-center rounded-[10px] bg-primary-600 px-5 font-bold text-white no-underline hover:bg-primary-700 active:bg-primary-800"
                    >
                        Skapa konto
                    </Link>
                </div>
            </div>
        </header>
    );
}
