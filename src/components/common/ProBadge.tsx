import { Crown, Shield, ShieldCheck } from 'lucide-react';
import type { UserRole } from '@/types';

interface ProBadgeProps {
    size?: 'xs' | 'sm' | 'md';
    className?: string;
    /** When true, uses absolute positioning (for card overlays). Default: false */
    absolute?: boolean;
}

/**
 * Pro member badge component
 * Gul premiumetikett enligt badge-premium-mönstret: brand-yellow med mörk text i båda lägena
 */
export function ProBadge({ size = 'sm', className = '', absolute = false }: ProBadgeProps) {
    const sizeClasses = {
        xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
        sm: 'text-xs px-2 py-0.5 gap-1',
        md: 'text-sm px-2.5 py-1 gap-1.5',
    };

    const iconSizes = {
        xs: 'w-2.5 h-2.5',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
    };

    return (
        <span
            className={`
                ${absolute ? 'absolute top-2 right-2' : ''} inline-flex items-center font-semibold rounded-full
                bg-brand-yellow text-surface-900
                ${sizeClasses[size]}
                ${className}
            `}
        >
            <Crown className={iconSizes[size]} />
            <span>PRO</span>
        </span>
    );
}

export default ProBadge;

interface RoleBadgeProps {
    role: UserRole | null;
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

const roleConfig = {
    superadmin: { label: 'Admin', icon: ShieldCheck, bg: 'bg-error-strong', text: 'text-white' },
    admin: { label: 'Admin', icon: ShieldCheck, bg: 'bg-error-strong', text: 'text-white' },
    moderator: { label: 'Mod', icon: Shield, bg: 'bg-primary-600', text: 'text-white' },
} as const;

export function RoleBadge({ role, size = 'sm', className = '' }: RoleBadgeProps) {
    if (!role || !(role in roleConfig)) return null;

    const config = roleConfig[role as keyof typeof roleConfig];
    const Icon = config.icon;

    const sizeClasses = {
        xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
        sm: 'text-xs px-2 py-0.5 gap-1',
        md: 'text-sm px-2.5 py-1 gap-1.5',
    };

    const iconSizes = {
        xs: 'w-2.5 h-2.5',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
    };

    return (
        <span
            className={`
                inline-flex items-center font-semibold rounded-full
                ${config.bg} ${config.text}
                ${sizeClasses[size]}
                ${className}
            `}
        >
            <Icon className={iconSizes[size]} />
            <span>{config.label}</span>
        </span>
    );
}
