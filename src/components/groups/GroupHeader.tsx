import { Link } from 'react-router-dom';
import { Settings, Users, Lock, Globe, LogOut, UserPlus } from 'lucide-react';
import type { GroupWithDetails } from '@/services/group';
import { hasPermission } from '@/services/group';

interface GroupHeaderProps {
    group: GroupWithDetails;
    onJoin?: () => void;
    onLeave?: () => void;
    isJoining?: boolean;
    isLeaving?: boolean;
}

const roleLabels: Record<string, string> = {
    admin: 'Administratör',
    moderator: 'Moderator',
    member: 'Medlem',
};

export default function GroupHeader({
    group,
    onJoin,
    onLeave,
    isJoining = false,
    isLeaving = false,
}: GroupHeaderProps) {
    const canEditSettings = hasPermission(group.user_role, 'edit_settings');

    return (
        <div className="card overflow-hidden">
            {/* Cover image */}
            <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600">
                {group.cover_url && (
                    <img
                        src={group.cover_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative px-6 pb-6">
                {/* Avatar - positioned to overlap cover */}
                <div className="absolute -top-12 left-6">
                    {group.avatar_url ? (
                        <img
                            src={group.avatar_url}
                            alt={group.name}
                            className="w-24 h-24 rounded-xl object-cover border-4 border-white dark:border-surface-900 bg-white dark:bg-surface-800"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-surface-900">
                            {group.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Actions - top right */}
                <div className="flex justify-end pt-4 gap-2">
                    {group.is_member ? (
                        <>
                            {canEditSettings && (
                                <Link
                                    to={`/classrooms/${group.slug}/settings`}
                                    className="btn-secondary"
                                >
                                    <Settings className="w-4 h-4" />
                                    Inställningar
                                </Link>
                            )}
                            {group.user_role !== 'admin' && (
                                <button
                                    onClick={onLeave}
                                    disabled={isLeaving}
                                    className="btn bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-error/10 dark:hover:bg-error/15 hover:text-error-strong dark:hover:text-error-soft"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {isLeaving ? 'Lämnar...' : 'Lämna'}
                                </button>
                            )}
                        </>
                    ) : (
                        !group.is_private && (
                            <button
                                onClick={onJoin}
                                disabled={isJoining}
                                className="btn-primary"
                            >
                                <UserPlus className="w-4 h-4" />
                                {isJoining ? 'Går med...' : 'Gå med i klassrummet'}
                            </button>
                        )
                    )}
                </div>

                {/* Group info */}
                <div className="mt-8">
                    <div className="flex flex-col items-left gap-3">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                            {group.name}
                        </h1>
                        {group.is_private ? (
                            <div className="flex items-center gap-1 text-surface-600 dark:text-surface-300">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm">Privat</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-surface-600 dark:text-surface-300">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm">Offentligt</span>
                            </div>
                        )}
                    </div>

                    {group.description && (
                        <p className="text-surface-600 dark:text-surface-300 mt-2 max-w-2xl">
                            {group.description}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2 text-surface-600 dark:text-surface-300">
                            <Users className="w-5 h-5" />
                            <span className="font-medium">{group.member_count}</span>
                            <span>medlemmar</span>
                        </div>
                        {group.is_member && group.user_role && (
                            <span className={
                                group.user_role === 'admin' ? 'badge-primary' :
                                    group.user_role === 'moderator' ? 'badge-warning' :
                                        'badge bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                            }>
                                {roleLabels[group.user_role] ?? group.user_role}
                            </span>
                        )}
                    </div>

                    {/* Creator info */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                        <span className="text-sm text-surface-600 dark:text-surface-300">Skapat av</span>
                        <Link
                            to={`/profile/${group.creator.username}`}
                            className="flex items-center gap-2 group"
                        >
                            {group.creator.avatar_url ? (
                                <img
                                    src={group.creator.avatar_url}
                                    alt={group.creator.display_name}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                                    {group.creator.display_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                {group.creator.display_name}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
