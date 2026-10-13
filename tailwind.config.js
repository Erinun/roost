/** @type {import('tailwindcss').Config} */
// =============================================================================
// Designtokens – Aktiespararnas grafiska profil 2023
// Se docs/redesign/designsystem.md för namnsättning, roller och kontrastregler.
// =============================================================================
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primärskala (mekanism för körtidstema via SiteSettingsContext).
                // Fallbackar genererade runt profilens primärblå #185DA9 (ankare på 600).
                primary: {
                    50: 'var(--color-primary-50, #F1F7FD)',
                    100: 'var(--color-primary-100, #E0EDFB)',
                    200: 'var(--color-primary-200, #BDD8F4)',
                    300: 'var(--color-primary-300, #8EBBEB)',
                    400: 'var(--color-primary-400, #5497DE)',
                    500: 'var(--color-primary-500, #2275CE)',
                    600: 'var(--color-primary-600, #185DA9)',
                    700: 'var(--color-primary-700, #134D8B)',
                    800: 'var(--color-primary-800, #113D6F)',
                    900: 'var(--color-primary-900, #0F2E52)',
                    950: 'var(--color-primary-950, #0A1D33)',
                },
                // Profilens nio färger. CSS-variabler definieras i src/index.css.
                // Mappning mot profilens namn:
                //   brand-blue   = primary-blue-400   #185DA9
                //   brand-sky    = secondary-blue-400 #159EDA
                //   brand-teal   = green-400          #32D7CD
                //   brand-purple = purple-700         #652FA0
                //   brand-plum   = purple-400         #973B8E
                //   brand-pink   = pink-600           #EE0181
                //   brand-red    = red-500            #EC5345
                //   brand-orange = orange-400         #F5A118
                //   brand-yellow = yellow-500         #FBC231
                brand: {
                    blue: 'var(--brand-blue, #185DA9)',
                    sky: 'var(--brand-sky, #159EDA)',
                    teal: 'var(--brand-teal, #32D7CD)',
                    purple: 'var(--brand-purple, #652FA0)',
                    plum: 'var(--brand-plum, #973B8E)',
                    pink: 'var(--brand-pink, #EE0181)',
                    red: 'var(--brand-red, #EC5345)',
                    orange: 'var(--brand-orange, #F5A118)',
                    yellow: 'var(--brand-yellow, #FBC231)',
                },
                // Neutraler härledda ur profilens mörkblå #0E2A4D.
                // Namnen behålls (surface-*) så att befintlig kod fortsätter fungera;
                // endast värdena är utbytta (tidigare rena grå).
                //   50  = tonad yta (#F3F7FC i profilen)
                //   200 = linjer (#D5E1EE i profilen)
                //   600 = dämpad text (#4A5B73 i profilen)
                //   900 = text / mörk kortbotten (#0E2A4D i profilen)
                surface: {
                    50: '#F3F7FC',
                    100: '#E8EFF7',
                    200: '#D5E1EE',
                    300: '#B9C9DE',
                    400: '#8CA0BC',
                    500: '#5C7190',
                    600: '#4A5B73',
                    700: '#334862',
                    800: '#1D3754',
                    900: '#0E2A4D',
                    950: '#081E3A',
                },
                // Accentfärger för reaktioner och märken (mappade mot profilen)
                accent: {
                    fire: '#F5A118',
                    love: '#EC5345',
                    clap: '#FBC231',
                    think: '#973B8E',
                },
                // Statusfärger (mappade mot profilen).
                // error.strong är en mörkare härledning av brand-red för vit text
                // i liten storlek (4,5:1); error.soft är en ljusare härledning för
                // feltext i mörkt läge. Se designsystem.md, avsnitt Avvikelser.
                success: '#32D7CD',
                warning: '#F5A118',
                error: {
                    DEFAULT: '#EC5345',
                    strong: '#B23327',
                    soft: '#F49B92',
                },
                info: '#159EDA',
            },
            // Profilens tre övertoningar som bakgrundstokens.
            // Definieras som CSS-variabler i src/index.css (en källa).
            backgroundImage: {
                'gradient-blue': 'var(--gradient-blue)',
                'gradient-purple': 'var(--gradient-purple)',
                'gradient-warm': 'var(--gradient-warm)',
            },
            // Typografi
            //   sans    = PT Sans (hela gränssnittet)
            //   heading = var(--font-heading): Ciutadella → Barlow → PT Sans
            //   serif   = PT Serif (citat, längre löptext)
            fontFamily: {
                sans: ['PT Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                heading: ['var(--font-heading)'],
                serif: ['PT Serif', 'Georgia', 'serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            // Avståndsskala (utökningar)
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            // Radier
            borderRadius: {
                '4xl': '2rem',
            },
            // Skuggor – blåtonade från #0E2A4D (rgba 14,42,77).
            // Obs: kort (.card) använder ALDRIG skugga, endast border.
            // Skuggor är reserverade för flytande lager (dropdown, modal).
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(14, 42, 77, 0.08), 0 10px 20px -2px rgba(14, 42, 77, 0.05)',
                'card': '0 0 0 1px rgba(14, 42, 77, 0.06), 0 1px 3px rgba(14, 42, 77, 0.10)',
                'elevated': '0 10px 40px -10px rgba(14, 42, 77, 0.25)',
                'soft-dark': '0 2px 15px -3px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.2)',
                'card-dark': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 1px 3px rgba(0, 0, 0, 0.3)',
                'elevated-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
            },
            // Animationer
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-in-right': 'slideInRight 0.25s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            },
            // Containerstorlekar
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },
        },
    },
    plugins: [],
};
