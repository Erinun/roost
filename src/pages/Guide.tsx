import { useState } from 'react';
import { APP_CONFIG } from '@/config/app';
import {
    BookOpen,
    Home,
    Users,
    MessageSquare,
    Calendar,
    Trophy,
    Settings,
    Bell,
    PenSquare,
    ChevronRight,
    CheckCircle,
    Sparkles,
    ZoomIn,
    X,
} from 'lucide-react';

// Step type with optional screenshot
interface GuideStep {
    title: string;
    description: string;
    tips: string[];
    screenshot?: {
        src: string;
        alt: string;
    };
}

interface GuideSection {
    id: string;
    title: string;
    icon: typeof Home;
    description: string;
    steps: GuideStep[];
}

// Guide section data with screenshots embedded in relevant steps
const guideSections: GuideSection[] = [
    {
        id: 'getting-started',
        title: 'Kom igång',
        icon: Sparkles,
        description: 'Lär dig grunderna i att navigera och använda plattformen',
        steps: [
            {
                title: 'Ställ in din profil',
                description: 'När du har loggat in, klicka på din avatar uppe till höger och välj "Inställningar" för att anpassa din profil. Lägg till en profilbild, ett visningsnamn, en bio och din plats så att andra medlemmar kan lära känna dig.',
                tips: ['Använd ett igenkännbart foto', 'Skriv en kort bio om dina intressen', 'Lägg till din plats för att hitta medlemmar nära dig'],
                screenshot: { src: '/guide-screenshots/settings.png', alt: 'Sidan för profilinställningar' },
            },
            {
                title: 'Utforska hemflödet',
                description: 'Hemflödet visar alla inlägg i communityt. Du kan filtrera inlägg efter kategori, se vad som trendar och upptäcka nytt innehåll från andra medlemmar.',
                tips: ['Använd kategorifilter för att hitta relevant innehåll', 'Kolla sidofältet för de främsta bidragsgivarna', 'Klicka på medlemmars avatarer för att se deras profiler'],
                screenshot: { src: '/guide-screenshots/home-feed.png', alt: 'Hemflödet' },
            },
            {
                title: 'Gå med i klassrum',
                description: 'Klassrum är specialiserade utrymmen med fokus på specifika ämnen. Bläddra bland tillgängliga klassrum och gå med i de som intresserar dig för att få åtkomst till exklusivt innehåll och diskussioner.',
                tips: ['Varje klassrum har sitt eget flöde och sina egna evenemang', 'Vissa klassrum kan kräva godkännande för att gå med', 'Du kan lämna ett klassrum när som helst via dess inställningar'],
                screenshot: { src: '/guide-screenshots/classrooms.png', alt: 'Klassrumssidan' },
            },
        ],
    },
    {
        id: 'creating-posts',
        title: 'Skapa inlägg',
        icon: PenSquare,
        description: 'Dela dina tankar, frågor och framgångar med communityt',
        steps: [
            {
                title: 'Starta ett nytt inlägg',
                description: 'Klicka på knappen "Skapa inlägg" eller inläggsrutan högst upp i ditt flöde. Ge inlägget en beskrivande titel och välj en lämplig kategori.',
                tips: ['Välj rätt kategori för bättre synlighet', 'Beskrivande titlar ger mer engagemang', 'Du kan publicera i huvudflödet eller i ett specifikt klassrum'],
                screenshot: { src: '/guide-screenshots/home-feed.png', alt: 'Inläggsrutan i hemflödet' },
            },
            {
                title: 'Lägg till rikt innehåll',
                description: 'Använd textredigeraren för att formatera ditt inlägg med rubriker, listor, kodblock med mera. Du kan också bädda in bilder och videor för att göra inläggen mer engagerande.',
                tips: ['Dra och släpp bilder direkt i redigeraren', 'YouTube- och Vimeo-länkar bäddas in automatiskt', 'Använd kodblock för att dela kodsnuttar'],
            },
            {
                title: 'Engagera dig i kommentarerna',
                description: 'Håll dig aktiv efter publiceringen genom att svara på kommentarer. Det bygger relationer och uppmuntrar till mer diskussion kring dina inlägg.',
                tips: ['Svara på kommentarer för att hålla samtalet igång', 'Använd @omnämnanden för att notifiera specifika medlemmar', 'Fäst viktiga kommentarer som inläggets författare'],
            },
        ],
    },
    {
        id: 'messaging',
        title: 'Direktmeddelanden',
        icon: MessageSquare,
        description: 'Håll kontakten privat med andra medlemmar i communityt',
        steps: [
            {
                title: 'Starta en konversation',
                description: 'Klicka på meddelandeikonen i navigeringsfältet för att öppna din inkorg. Klicka på "Nytt meddelande" eller gå till en medlems profil och välj "Meddelande" för att starta en konversation.',
                tips: ['Dina senaste konversationer visas i sidofältet', 'Olästa meddelanden visar en notisbricka', 'Du kan skicka text, bilder och filer'],
                screenshot: { src: '/guide-screenshots/messages.png', alt: 'Meddelandesidan' },
            },
            {
                title: 'Meddelandefunktioner',
                description: 'Meddelanden levereras i realtid med läskvitton. Du kan se när ditt meddelande levererades och när mottagaren läste det.',
                tips: ['Blå bockar betyder att meddelandet är läst', 'Tryck på Enter för att skicka, Shift+Enter för ny rad', 'Bifoga filer med gemikonen'],
            },
        ],
    },
    {
        id: 'events-calendar',
        title: 'Evenemang & kalender',
        icon: Calendar,
        description: 'Upptäck och delta i communityts evenemang',
        steps: [
            {
                title: 'Bläddra bland evenemang',
                description: 'Öppna kalendern från navigeringsfältet för att se alla kommande evenemang i communityt. Evenemang kan gälla hela communityt eller ett specifikt klassrum du gått med i.',
                tips: ['Klicka på ett datum för att se dagens evenemang', 'Filtrera per klassrum för att se specifika evenemang', 'Kommande evenemang visas också i sidofältet'],
                screenshot: { src: '/guide-screenshots/calendar.png', alt: 'Kalendervy' },
            },
            {
                title: 'OSA till evenemang',
                description: 'Klicka på ett evenemang för att se detaljer som tid, plats, beskrivning och deltagare. Klicka på "OSA" för att bekräfta att du kommer.',
                tips: ['Du får påminnelser om evenemang du har OSA:t till', 'Se vilka andra som deltar', 'Lägg till evenemang i din egen kalender'],
            },
            {
                title: 'Skapa evenemang (moderatorer)',
                description: 'Om du är moderator eller admin för ett klassrum kan du skapa evenemang för ditt community. Klicka på ett datum i kalendern eller använd knappen "Skapa evenemang".',
                tips: ['Ange tydliga titlar och beskrivningar', 'Ta med alla relevanta detaljer som länkar eller plats', 'Evenemang kan vara återkommande eller engångshändelser'],
            },
        ],
    },
    {
        id: 'leaderboard',
        title: 'Topplista & poäng',
        icon: Trophy,
        description: 'Följ dina bidrag och tävla med andra medlemmar',
        steps: [
            {
                title: 'Tjäna poäng',
                description: 'Du tjänar poäng för olika aktiviteter i communityt. Poängen speglar ditt engagemang och ditt bidrag till communityt.',
                tips: ['Skapa inlägg: 10 poäng', 'Kommentarer: 5 poäng', 'Få reaktioner: 1-2 poäng', 'Arrangera evenemang: 15 poäng'],
            },
            {
                title: 'Klättra på topplistan',
                description: 'Topplistan visar de främsta bidragsgivarna de senaste 30 dagarna. Regelbundet engagemang hjälper dig att klättra i rankningen och få uppmärksamhet.',
                tips: ['Se din nuvarande placering på din profil', 'Visa hela topplistan från sidofältet', 'Varje klassrum har sin egen topplista'],
                screenshot: { src: '/guide-screenshots/leaderboard.png', alt: 'Topplistesidan' },
            },
        ],
    },
    {
        id: 'notifications',
        title: 'Notiser',
        icon: Bell,
        description: 'Håll dig uppdaterad om aktivitet som är viktig för dig',
        steps: [
            {
                title: 'Notistyper',
                description: 'Du får notiser om olika aktiviteter, till exempel svar på dina inlägg, omnämnanden, nya meddelanden, evenemangspåminnelser med mera.',
                tips: ['Klicka på klockikonen för att se alla notiser', 'Olästa notiser visas med en röd bricka', 'Klicka på en notis för att gå direkt till innehållet'],
            },
            {
                title: 'Hantera notiser',
                description: 'Markera notiser som lästa en i taget eller markera alla som lästa. Du kan anpassa vilka notiser du får i dina inställningar.',
                tips: ['Svep eller klicka för att markera som läst', 'Använd "Markera alla som lästa" för att rensa brickan', 'Justera inställningarna under Inställningar > Notiser'],
                screenshot: { src: '/guide-screenshots/settings.png', alt: 'Inställningssidan för notisinställningar' },
            },
        ],
    },
    {
        id: 'members',
        title: 'Medlemskatalog',
        icon: Users,
        description: 'Upptäck och knyt kontakt med communityts medlemmar',
        steps: [
            {
                title: 'Bläddra bland medlemmar',
                description: 'Öppna medlemskatalogen från navigeringsfältet. Bläddra bland alla medlemmar i communityt, se deras profiler och vilka som är online just nu.',
                tips: ['Grön prick betyder att medlemmen är online', 'Använd sök för att hitta specifika medlemmar', 'Filtrera på onlinestatus'],
                screenshot: { src: '/guide-screenshots/members.png', alt: 'Medlemskatalogen' },
            },
            {
                title: 'Medlemsprofiler',
                description: 'Klicka på en medlem för att se hela profilen med bio, inlägg och aktivitet. Därifrån kan du skicka ett meddelande eller följa personens innehåll.',
                tips: ['Se deras senaste inlägg och kommentarer', 'Visa deras poäng och placering', 'Snabbåtgärder för meddelanden'],
                screenshot: { src: '/guide-screenshots/profile.png', alt: 'Medlemsprofilsida' },
            },
        ],
    },
];

// Feature card component
function FeatureCard({ icon: Icon, title, description }: { icon: typeof Home; title: string; description: string }) {
    return (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">{title}</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">{description}</p>
        </div>
    );
}

// Screenshot lightbox state manager
function useScreenshotLightbox() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    return { selectedImage, setSelectedImage };
}

// Inline screenshot component
function InlineScreenshot({
    screenshot,
    onZoom
}: {
    screenshot: { src: string; alt: string };
    onZoom: (src: string) => void;
}) {
    return (
        <button
            onClick={() => onZoom(screenshot.src)}
            className="group relative w-full mt-4 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
        >
            <img
                src={screenshot.src}
                alt={screenshot.alt}
                className="w-full h-auto"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-surface-950/0 group-hover:bg-surface-950/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-surface-800 rounded-full p-3 shadow-elevated dark:shadow-elevated-dark">
                    <ZoomIn className="w-5 h-5 text-surface-700 dark:text-surface-300" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-950/60 to-transparent p-3">
                <p className="text-white text-sm font-medium">{screenshot.alt}</p>
            </div>
        </button>
    );
}

// Step card component with integrated screenshot
function StepCard({
    step,
    index,
    onZoom
}: {
    step: GuideStep;
    index: number;
    onZoom: (src: string) => void;
}) {
    return (
        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">{step.title}</h4>
                    <p className="text-surface-600 dark:text-surface-400 text-sm mb-4">{step.description}</p>
                    <div className="space-y-2">
                        {step.tips.map((tip, tipIndex) => (
                            <div key={tipIndex} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-surface-600 dark:text-surface-400">{tip}</span>
                            </div>
                        ))}
                    </div>

                    {/* Inline screenshot for this step */}
                    {step.screenshot && (
                        <InlineScreenshot screenshot={step.screenshot} onZoom={onZoom} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Lightbox component
function Lightbox({
    selectedImage,
    onClose
}: {
    selectedImage: string | null;
    onClose: () => void;
}) {
    if (!selectedImage) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-surface-950/90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
                <X className="w-6 h-6 text-white" />
            </button>
            <img
                src={selectedImage}
                alt="Förhandsvisning av skärmbild"
                className="max-w-full max-h-[90vh] rounded-lg shadow-elevated"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

// Navigation sidebar for guide sections
function GuideSidebar({
    sections,
    activeSection,
    onSectionClick
}: {
    sections: GuideSection[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}) {
    return (
        <nav className="space-y-1">
            {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                    <button
                        key={section.id}
                        onClick={() => onSectionClick(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            isActive
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400'
                                : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                        }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`} />
                        <span className="font-medium">{section.title}</span>
                        <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </button>
                );
            })}
        </nav>
    );
}

export default function Guide() {
    const [activeSection, setActiveSection] = useState('getting-started');
    const { selectedImage, setSelectedImage } = useScreenshotLightbox();

    const currentSection = guideSections.find((s) => s.id === activeSection) || guideSections[0];
    const Icon = currentSection.icon;

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        // Scroll to top of content on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl mb-4">
                    <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
                    Plattformsguide
                </h1>
                <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
                    Allt du behöver veta för att få ut det mesta av {APP_CONFIG.name}.
                    Lär dig hur du håller kontakten, delar och växer tillsammans med vårt community.
                </p>
            </div>

            {/* Quick Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <FeatureCard
                    icon={Home}
                    title="Communityflöde"
                    description="Dela och upptäck inlägg från medlemmar"
                />
                <FeatureCard
                    icon={Users}
                    title="Klassrum"
                    description="Gå med i ämnesfokuserade klassrum"
                />
                <FeatureCard
                    icon={MessageSquare}
                    title="Direktmeddelanden"
                    description="Privata konversationer med medlemmar"
                />
                <FeatureCard
                    icon={Calendar}
                    title="Evenemang"
                    description="Upptäck och delta i communityts evenemang"
                />
            </div>

            {/* Main Content with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4 px-4">
                            Guideavsnitt
                        </h2>
                        <GuideSidebar
                            sections={guideSections}
                            activeSection={activeSection}
                            onSectionClick={scrollToSection}
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{currentSection.title}</h2>
                                    <p className="text-primary-100 mt-1">{currentSection.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Steps with inline screenshots */}
                        <div className="p-8 space-y-6">
                            {currentSection.steps.map((step, index) => (
                                <StepCard
                                    key={index}
                                    step={step}
                                    index={index}
                                    onZoom={setSelectedImage}
                                />
                            ))}
                        </div>

                        {/* Navigation Footer */}
                        <div className="border-t border-surface-200 dark:border-surface-700 p-6 flex justify-between">
                            {guideSections.findIndex((s) => s.id === activeSection) > 0 ? (
                                <button
                                    onClick={() => {
                                        const currentIndex = guideSections.findIndex((s) => s.id === activeSection);
                                        if (currentIndex > 0) {
                                            scrollToSection(guideSections[currentIndex - 1].id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                    Föregående avsnitt
                                </button>
                            ) : (
                                <div />
                            )}
                            {guideSections.findIndex((s) => s.id === activeSection) < guideSections.length - 1 ? (
                                <button
                                    onClick={() => {
                                        const currentIndex = guideSections.findIndex((s) => s.id === activeSection);
                                        if (currentIndex < guideSections.length - 1) {
                                            scrollToSection(guideSections[currentIndex + 1].id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
                                >
                                    Nästa avsnitt
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <div />
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 bg-gradient-to-r from-surface-100 to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                            Snabbåtgärder
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <a
                                href="/"
                                className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <Home className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-medium text-surface-900 dark:text-surface-100">Gå till flödet</span>
                            </a>
                            <a
                                href="/classrooms"
                                className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-medium text-surface-900 dark:text-surface-100">Bläddra bland klassrum</span>
                            </a>
                            <a
                                href="/settings"
                                className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-medium text-surface-900 dark:text-surface-100">Redigera inställningar</span>
                            </a>
                        </div>
                    </div>

                    {/* Need Help */}
                    <div className="mt-6 text-center">
                        <p className="text-surface-500 dark:text-surface-400">
                            Har du fler frågor?{' '}
                            <a href="/messages" className="text-primary-600 dark:text-primary-400 hover:underline">
                                Skicka ett meddelande till oss
                            </a>{' '}
                            så hjälper vi dig gärna!
                        </p>
                    </div>
                </div>
            </div>

            {/* Lightbox for zoomed screenshots */}
            <Lightbox selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />
        </div>
    );
}
