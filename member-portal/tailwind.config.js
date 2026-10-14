/** @type {import('tailwindcss').Config} */
// =============================================================================
// Designtokens – kopierade från Roost (Aktiespararnas grafiska profil 2023).
// Medlemsportalen är en separat kodbas; dupliceringen är avsiktlig.
// Obs: kort använder ALDRIG skugga, endast border.
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
                // Primärskala – fallbackar genererade runt profilens primärblå #185DA9.
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
                // Statusfärger (mappade mot profilen).
                success: '#32D7CD',
                warning: '#F5A118',
                error: {
                    DEFAULT: '#EC5345',
                    strong: '#B23327',
                    soft: '#F49B92',
                },
                info: '#159EDA',
            },
            // Profilens tre övertoningar (CSS-variabler i src/index.css).
            backgroundImage: {
                'gradient-blue': 'var(--gradient-blue)',
                'gradient-purple': 'var(--gradient-purple)',
                'gradient-warm': 'var(--gradient-warm)',
            },
            // Typografi: PT Sans = gränssnitt, Barlow (ersätter Ciutadella) = rubriker.
            fontFamily: {
                sans: ['PT Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                heading: ['var(--font-heading)'],
                serif: ['PT Serif', 'Georgia', 'serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            // Radier
            borderRadius: {
                '4xl': '2rem',
            },
            // Skuggor – ENDAST för flytande lager (dropdown, modal), aldrig kort.
            boxShadow: {
                'elevated': '0 10px 40px -10px rgba(14, 42, 77, 0.25)',
                'elevated-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
            },
            // Animationer
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
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
            },
        },
    },
    plugins: [],
};
