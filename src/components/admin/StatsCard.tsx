import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive?: boolean;
    };
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
    children?: ReactNode;
}

const colorClasses = {
    blue: 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300',
    green: 'bg-success/15 dark:bg-success/20 text-surface-900 dark:text-success',
    purple: 'bg-brand-purple text-white',
    orange: 'bg-brand-orange text-surface-900',
    red: 'bg-error/15 dark:bg-error/20 text-error-strong dark:text-error-soft',
    indigo: 'bg-brand-sky text-surface-900',
};

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    children,
}: StatsCardProps) {
    return (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-surface-100">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <p className="mt-2 text-sm">
                            <span
                                className={`font-medium ${trend.isPositive ? 'text-surface-900 dark:text-success' : 'text-error-strong dark:text-error-soft'
                                    }`}
                            >
                                {trend.isPositive ? '+' : ''}{trend.value}
                            </span>
                            <span className="text-surface-500 dark:text-surface-400 ml-1">{trend.label}</span>
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {children}
        </div>
    );
}
