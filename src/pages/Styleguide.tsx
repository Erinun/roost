import { useState } from 'react';
import { Moon, Sun, Star, Check, AlertTriangle, X, Pencil, Trash2, LogOut, User } from 'lucide-react';

/**
 * Intern styleguide för Aktiespararnas grafiska profil 2023.
 * Visar designtokens (färger, övertoningar, typografi) och alla
 * baskomponenter i sina tillstånd. Se docs/redesign/designsystem.md.
 */

// Profilens nio färger: tokennamn, hex (visningstext) och roll.
const brandColors = [
    { cls: 'bg-brand-blue', name: 'brand-blue', profil: 'primary-blue-400', hex: '#185DA9', roll: 'Primärfärg: knappar, länkar, aktiv navigation, fokusring', darkText: false },
    { cls: 'bg-brand-sky', name: 'brand-sky', profil: 'secondary-blue-400', hex: '#159EDA', roll: 'Sekundär accent, informationsytor (vit text endast stor)', darkText: false },
    { cls: 'bg-brand-teal', name: 'brand-teal', profil: 'green-400', hex: '#32D7CD', roll: 'Accent/bekräftelse – alltid mörk text', darkText: true },
    { cls: 'bg-brand-purple', name: 'brand-purple', profil: 'purple-700', hex: '#652FA0', roll: 'Sparsam accent: citat, kampanj/evenemang', darkText: false },
    { cls: 'bg-brand-plum', name: 'brand-plum', profil: 'purple-400', hex: '#973B8E', roll: 'Sparsam accent: citat, kampanj/evenemang', darkText: false },
    { cls: 'bg-brand-pink', name: 'brand-pink', profil: 'pink-600', hex: '#EE0181', roll: 'Sparsam accent – vit text endast stor, annars dekor', darkText: false },
    { cls: 'bg-brand-red', name: 'brand-red', profil: 'red-500', hex: '#EC5345', roll: 'Fel/varning på ytor, inte som textfärg', darkText: true },
    { cls: 'bg-brand-orange', name: 'brand-orange', profil: 'orange-400', hex: '#F5A118', roll: 'Premium/framhävning – alltid mörk text', darkText: true },
    { cls: 'bg-brand-yellow', name: 'brand-yellow', profil: 'yellow-500', hex: '#FBC231', roll: 'Premium/etiketter – alltid mörk text', darkText: true },
];

const gradients = [
    { cls: 'bg-gradient-blue', name: 'gradient-blue', beskrivning: '#185DA9 → #159EDA → #32D7CD', anvandning: 'Hero, informationsytor' },
    { cls: 'bg-gradient-purple', name: 'gradient-purple', beskrivning: '#652FA0 → #973B8E → #EE0181', anvandning: 'Citat, kampanj/evenemang' },
    { cls: 'bg-gradient-warm', name: 'gradient-warm', beskrivning: '#EC5345 → #F5A118 → #FBC231', anvandning: 'Premium, avslutande uppmaning' },
];

const primaryScale = [
    { cls: 'bg-primary-50', step: '50', hex: '#F1F7FD' },
    { cls: 'bg-primary-100', step: '100', hex: '#E0EDFB' },
    { cls: 'bg-primary-200', step: '200', hex: '#BDD8F4' },
    { cls: 'bg-primary-300', step: '300', hex: '#8EBBEB' },
    { cls: 'bg-primary-400', step: '400', hex: '#5497DE' },
    { cls: 'bg-primary-500', step: '500', hex: '#2275CE' },
    { cls: 'bg-primary-600', step: '600', hex: '#185DA9' },
    { cls: 'bg-primary-700', step: '700', hex: '#134D8B' },
    { cls: 'bg-primary-800', step: '800', hex: '#113D6F' },
    { cls: 'bg-primary-900', step: '900', hex: '#0F2E52' },
    { cls: 'bg-primary-950', step: '950', hex: '#0A1D33' },
];

const surfaceScale = [
    { cls: 'bg-surface-50', step: '50', hex: '#F3F7FC', roll: 'Tonad yta / sidbakgrund' },
    { cls: 'bg-surface-100', step: '100', hex: '#E8EFF7', roll: 'Tonad yta, hover' },
    { cls: 'bg-surface-200', step: '200', hex: '#D5E1EE', roll: 'Linjer (profilens linjefärg)' },
    { cls: 'bg-surface-300', step: '300', hex: '#B9C9DE', roll: 'Fältkanter, rullningslister' },
    { cls: 'bg-surface-400', step: '400', hex: '#8CA0BC', roll: 'Ikoner, dekor' },
    { cls: 'bg-surface-500', step: '500', hex: '#5C7190', roll: 'Platshållartext' },
    { cls: 'bg-surface-600', step: '600', hex: '#4A5B73', roll: 'Dämpad text (profilens)' },
    { cls: 'bg-surface-700', step: '700', hex: '#334862', roll: 'Etiketter / mörka linjer' },
    { cls: 'bg-surface-800', step: '800', hex: '#1D3754', roll: 'Mörkt läge: fält/menyer' },
    { cls: 'bg-surface-900', step: '900', hex: '#0E2A4D', roll: 'Text (profilens) / mörka kort' },
    { cls: 'bg-surface-950', step: '950', hex: '#081E3A', roll: 'Mörkt läge: sidbakgrund' },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
    return <h2 className="text-2xl text-surface-900 dark:text-surface-50 mt-12 mb-4">{children}</h2>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
    return <h3 className="text-lg text-surface-900 dark:text-surface-50 mt-8 mb-3">{children}</h3>;
}

export default function Styleguide() {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [showModal, setShowModal] = useState(false);

    const toggleDark = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(document.documentElement.classList.contains('dark'));
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
            {/* Hero med blå övertoning */}
            <header className="bg-gradient-blue">
                <div className="max-w-5xl mx-auto px-6 py-14">
                    <p className="text-sm font-semibold text-white/90 uppercase tracking-wider">Roost – designgrund, fas 1</p>
                    <h1 className="text-4xl sm:text-5xl text-white uppercase mt-2">Styleguide</h1>
                    <p className="text-white text-lg mt-3 max-w-2xl">
                        Designtokens och baskomponenter enligt Aktiespararnas grafiska profil 2023.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pb-24">
                {/* Lägesväxlare */}
                <div className="flex justify-end pt-6">
                    <button type="button" onClick={toggleDark} className="btn-secondary">
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {isDark ? 'Ljust läge' : 'Mörkt läge'}
                    </button>
                </div>

                {/* ============================= FÄRGER ============================= */}
                <SectionHeading>Profilens färger</SectionHeading>
                <p className="text-surface-600 dark:text-surface-300 mb-6 max-w-3xl">
                    Nio färger. Mörk text på grönt, orange och gult – alltid. Vit text bara på
                    primärblått och lila; på rosa, rött och sekundärblått endast i stor text.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brandColors.map((c) => (
                        <div key={c.name} className="card overflow-hidden">
                            <div className={`${c.cls} h-20 flex items-end p-3`}>
                                <span className={`text-sm font-bold ${c.darkText ? 'text-surface-900' : 'text-white'}`}>Aa</span>
                            </div>
                            <div className="p-3">
                                <p className="font-bold text-sm">{c.name}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">{c.hex} · {c.profil}</p>
                                <p className="text-xs text-surface-600 dark:text-surface-300 mt-1">{c.roll}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ============================= ÖVERTONINGAR ============================= */}
                <SectionHeading>Övertoningar</SectionHeading>
                <p className="text-surface-600 dark:text-surface-300 mb-6 max-w-3xl">
                    Används på utvalda ytor: hero, avslutande uppmaning, premium och citat – inte överallt.
                    Text läggs på en solid yta ovanpå, eller som stor vit text i gradientens mörka ände.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {gradients.map((g) => (
                        <div key={g.name} className="card overflow-hidden">
                            <div className={`${g.cls} h-24`} />
                            <div className="p-3">
                                <p className="font-bold text-sm">{g.name}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">{g.beskrivning}</p>
                                <p className="text-xs text-surface-600 dark:text-surface-300 mt-1">{g.anvandning}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ============================= SKALOR ============================= */}
                <SectionHeading>Färgskalor</SectionHeading>
                <SubHeading>primary (körtidstema, fallback runt #185DA9 – ankare på 600)</SubHeading>
                <div className="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                    {primaryScale.map((s) => (
                        <div key={s.step} className={`${s.cls} flex-1 h-16 flex flex-col items-center justify-end pb-1`}>
                            <span className={`text-[10px] font-mono ${Number(s.step) >= 500 ? 'text-white' : 'text-surface-900'}`}>{s.step}</span>
                        </div>
                    ))}
                </div>
                <SubHeading>surface (neutraler härledda ur #0E2A4D)</SubHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {surfaceScale.map((s) => (
                        <div key={s.step} className="flex items-center gap-3 card p-2">
                            <div className={`${s.cls} w-10 h-10 rounded-md border border-surface-200 dark:border-surface-700 shrink-0`} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold font-mono">surface-{s.step} · {s.hex}</p>
                                <p className="text-xs text-surface-600 dark:text-surface-300 truncate">{s.roll}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ============================= TYPOGRAFI ============================= */}
                <SectionHeading>Typografi</SectionHeading>
                <div className="card p-6 space-y-6">
                    <div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 font-mono mb-2">
                            font-heading · var(--font-heading): Ciutadella → Barlow → PT Sans · fet vikt
                        </p>
                        <h1 className="text-5xl">Rubrik 1 – 48 px</h1>
                        <h2 className="text-3xl mt-2">Rubrik 2 – 30 px</h2>
                        <h3 className="text-2xl mt-2">Rubrik 3 – 24 px</h3>
                        <h4 className="text-xl mt-2">Rubrik 4 – 20 px</h4>
                    </div>
                    <div className="bg-gradient-blue rounded-lg p-6">
                        <h2 className="text-3xl text-white uppercase">Stor rubrik på färgad yta – gärna versaler</h2>
                    </div>
                    <div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 font-mono mb-2">font-sans · PT Sans · brödtext, knappar, formulär, menyer</p>
                        <p className="max-w-2xl">
                            Hela gränssnittet sätts i PT Sans. Aktiespararna hjälper dig som vill ta makten
                            över din ekonomiska framtid – vi lär dig spara smart i aktier och fonder.
                        </p>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-2 max-w-2xl">
                            Dämpad brödtext i mindre grad för sekundär information.
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 font-mono mb-2">font-serif · PT Serif · citat och längre löptext</p>
                        <blockquote className="border-l-4 border-brand-purple pl-4 text-lg italic text-surface-700 dark:text-surface-200 max-w-2xl">
                            ”Kunskap är den bästa investeringen. Den som förstår sitt sparande
                            fattar bättre beslut – och vågar hålla fast vid dem.”
                        </blockquote>
                    </div>
                </div>

                {/* ============================= KNAPPAR ============================= */}
                <SectionHeading>Knappar</SectionHeading>
                <p className="text-surface-600 dark:text-surface-300 mb-4">Minst 44 px höga. Fokusring i primärblått – tabba för att se den.</p>
                <div className="card p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <button className="btn-primary">Primär</button>
                        <button className="btn-secondary">Sekundär</button>
                        <button className="btn-ghost">Diskret</button>
                        <button className="btn-danger"><Trash2 className="w-4 h-4" />Ta bort</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button className="btn-primary" disabled>Primär inaktiv</button>
                        <button className="btn-secondary" disabled>Sekundär inaktiv</button>
                        <button className="btn-ghost" disabled>Diskret inaktiv</button>
                        <button className="btn-danger" disabled>Ta bort inaktiv</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                        <a href="#lank" className="link">Länk-stil (.link)</a>
                        <a href="#lank" className="mention-link">@omnämnande</a>
                    </div>
                </div>

                {/* ============================= FORMULÄR ============================= */}
                <SectionHeading>Formulär</SectionHeading>
                <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="sg-normal" className="label">E-post</label>
                        <input id="sg-normal" type="email" className="input" placeholder="du@exempel.se" />
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Hjälptext under fältet.</p>
                    </div>
                    <div>
                        <label htmlFor="sg-error" className="label">Lösenord</label>
                        <input id="sg-error" type="password" className="input-error" defaultValue="fel" />
                        <p className="text-xs text-surface-700 dark:text-error-soft font-semibold mt-1">Lösenordet är för kort.</p>
                    </div>
                    <div>
                        <label htmlFor="sg-disabled" className="label">Inaktivt fält</label>
                        <input id="sg-disabled" type="text" className="input" disabled placeholder="Kan inte ändras" />
                    </div>
                    <div>
                        <label htmlFor="sg-select" className="label">Fokusera mig (tab)</label>
                        <input id="sg-select" type="text" className="input" placeholder="Fokusring + blå kant" />
                    </div>
                </div>

                {/* ============================= KORT ============================= */}
                <SectionHeading>Kort</SectionHeading>
                <p className="text-surface-600 dark:text-surface-300 mb-4">Kort har aldrig skugga – endast border. Hover markeras med blåtonad kant.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-5">
                        <h3 className="text-lg">Vanligt kort (.card)</h3>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">Vit yta, linje i surface-200, radie xl.</p>
                    </div>
                    <div className="card-hover p-5 cursor-pointer">
                        <h3 className="text-lg">Klickbart kort (.card-hover)</h3>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">Håll muspekaren här – kanten blir blå.</p>
                    </div>
                </div>

                {/* ============================= MÄRKEN ============================= */}
                <SectionHeading>Märken (badges)</SectionHeading>
                <div className="card p-6 flex flex-wrap items-center gap-3">
                    <span className="badge-primary"><Star className="w-3 h-3" />Primär</span>
                    <span className="badge-success"><Check className="w-3 h-3" />Klart</span>
                    <span className="badge-warning"><AlertTriangle className="w-3 h-3" />Varning</span>
                    <span className="badge-error"><X className="w-3 h-3" />Fel</span>
                    <span className="badge-premium"><Star className="w-3 h-3" />Premium</span>
                </div>

                {/* ============================= MENY ============================= */}
                <SectionHeading>Meny (dropdown)</SectionHeading>
                <div className="card p-6">
                    <div className="dropdown-menu !relative inline-block">
                        <button className="dropdown-item"><User className="w-4 h-4" />Min profil</button>
                        <button className="dropdown-item"><Pencil className="w-4 h-4" />Redigera</button>
                        <button className="dropdown-item"><LogOut className="w-4 h-4" />Logga ut</button>
                    </div>
                </div>

                {/* ============================= MODAL ============================= */}
                <SectionHeading>Modal</SectionHeading>
                <div className="card p-6">
                    <button className="btn-primary" onClick={() => setShowModal(true)}>Öppna modal</button>
                    {showModal && (
                        <div className="modal-overlay flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                            <div className="modal-content w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-xl">Modalrubrik</h3>
                                <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">
                                    Flytande lager (modal, meny) får ha skugga – till skillnad från kort.
                                </p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button className="btn-secondary" onClick={() => setShowModal(false)}>Avbryt</button>
                                    <button className="btn-primary" onClick={() => setShowModal(false)}>Bekräfta</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ============================= TABELL ============================= */}
                <SectionHeading>Tabell</SectionHeading>
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="table-header">
                                <th className="text-left px-4 py-3 font-semibold">Namn</th>
                                <th className="text-left px-4 py-3 font-semibold">Roll</th>
                                <th className="text-left px-4 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="table-row">
                                <td className="table-cell px-4 py-3">Anna Andersson</td>
                                <td className="table-cell px-4 py-3">Administratör</td>
                                <td className="px-4 py-3"><span className="badge-success">Aktiv</span></td>
                            </tr>
                            <tr className="table-row">
                                <td className="table-cell px-4 py-3">Bo Bergström</td>
                                <td className="table-cell px-4 py-3">Medlem</td>
                                <td className="px-4 py-3"><span className="badge-premium">Premium</span></td>
                            </tr>
                            <tr className="table-row">
                                <td className="table-cell px-4 py-3">Cecilia Carlsson</td>
                                <td className="table-cell px-4 py-3">Medlem</td>
                                <td className="px-4 py-3"><span className="badge-warning">Väntar</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ============================= SKELETT & AVATARER ============================= */}
                <SectionHeading>Skelettladdare och avatarer</SectionHeading>
                <div className="card p-6 space-y-6">
                    <div className="space-y-2 max-w-sm">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-4 w-full" />
                        <div className="skeleton h-4 w-1/2" />
                    </div>
                    <div className="flex items-end gap-4">
                        <span className="avatar-sm">AA</span>
                        <span className="avatar-md">BB</span>
                        <span className="avatar-lg">CC</span>
                        <span className="avatar-xl">DD</span>
                    </div>
                </div>

                {/* ============================= EXEMPELYTOR ============================= */}
                <SectionHeading>Exempel: uppmaning och citat på övertoning</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-warm rounded-xl p-1">
                        <div className="bg-white dark:bg-surface-900 rounded-lg p-6 h-full">
                            <span className="badge-premium mb-3"><Star className="w-3 h-3" />Premium</span>
                            <h3 className="text-2xl mt-2">Skaffa premium</h3>
                            <p className="text-sm text-surface-600 dark:text-surface-300 mt-1 mb-4">
                                Varm övertoning som ram – innehållet ligger på solid yta för läsbarhet.
                            </p>
                            <button className="btn-primary w-full">Uppgradera</button>
                        </div>
                    </div>
                    <div className="bg-gradient-purple rounded-xl p-6 flex items-center">
                        <blockquote className="text-white text-2xl leading-snug">
                            ”Stor vit text fungerar på den lila övertoningen.”
                        </blockquote>
                    </div>
                </div>
            </main>
        </div>
    );
}
