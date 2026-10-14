import { Trophy } from 'lucide-react';

interface UserRankBadgeProps {
    rank: number;
    size?: 'sm' | 'md' | 'lg';
}

export default function UserRankBadge({ rank, size = 'md' }: UserRankBadgeProps) {
    // Size configurations
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    const iconSizes = {
        sm: 12,
        md: 16,
        lg: 20,
    };

    // Färgkodning per placering – profilens palett med mörk text på gult/orange
    const getBadgeColor = () => {
        if (rank === 1) return 'bg-brand-yellow text-surface-900'; // Guld
        if (rank <= 3) return 'bg-surface-300 text-surface-900'; // Silver
        if (rank <= 10) return 'bg-brand-orange text-surface-900'; // Brons
        if (rank <= 50) return 'bg-primary-600 text-white'; // Blå
        return 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200'; // Standard
    };

    return (
        <div
            className={`
                ${sizeClasses[size]}
                ${getBadgeColor()}
                rounded-full
                flex items-center justify-center
                font-bold
                relative
            `}
            title={`Placering #${rank}`}
        >
            {rank === 1 && (
                <Trophy
                    size={iconSizes[size]}
                    className="absolute -top-1 -right-1 text-brand-orange"
                    strokeWidth={3}
                />
            )}
            #{rank}
        </div>
    );
}
