import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import LandingBenefits from '@/components/landing/LandingBenefits';
import LandingSteps from '@/components/landing/LandingSteps';
import LandingMembership from '@/components/landing/LandingMembership';
import LandingQuote from '@/components/landing/LandingQuote';
import LandingFaq from '@/components/landing/LandingFaq';
import LandingCta from '@/components/landing/LandingCta';
import LandingFooter from '@/components/landing/LandingFooter';

/**
 * Publik landningssida för utloggade besökare på "/".
 * Referens: Landningssidan/sida 1.md – sektionsordning, texter, proportioner
 * och färgroller gäller som facit; alla färger via tokens (designsystem.md).
 * Sidan är ljus oavsett dark-läge: varje sektion sätter explicit bakgrund
 * och textfärg, och inga dark:-varianter används.
 */
export default function Landing() {
    return (
        <div className="min-h-screen bg-white font-sans text-[17px] leading-[1.55] text-surface-900 antialiased">
            <LandingHeader />
            <main>
                <LandingHero />
                <LandingBenefits />
                <LandingSteps />
                <LandingMembership />
                <LandingQuote />
                <LandingFaq />
                <LandingCta />
            </main>
            <LandingFooter />
        </div>
    );
}
