// LOGO-platshållare enligt referensen (Landningssidan/sida 1.md):
// streckad ruta med texten LOGO. Ersätts INTE med bildfil i detta skede.
interface LogoPlaceholderProps {
    /** 'blue' = primärblå streck (ljus botten), 'white' = vita streck (mörk botten) */
    tone?: 'blue' | 'white';
}

export default function LogoPlaceholder({ tone = 'blue' }: LogoPlaceholderProps) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-2 border-dashed text-[10px] font-bold tracking-[0.06em] ${
                tone === 'white'
                    ? 'border-white text-white'
                    : 'border-primary-600 text-primary-600'
            }`}
        >
            LOGO
        </span>
    );
}
