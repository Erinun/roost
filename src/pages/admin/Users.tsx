import { useEffect, useState, useCallback } from 'react';
import {
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Crown,
    Ban,
    UserCheck,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Star,
} from 'lucide-react';
import { BanUserModal } from '../../components/admin';
import {
    getUsers,
    unbanUser,
    updateUserRole,
    updateMembershipType,
    checkIsSuperadmin,
} from '../../services';
import type { UserWithBanInfo } from '../../services';
import type { UserRole } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_COLORS: Record<string, string> = {
    user: 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300',
    moderator: 'bg-info/15 text-surface-900 dark:bg-info/20 dark:text-info',
    admin: 'bg-brand-purple text-white',
    superadmin: 'bg-warning/20 text-surface-900 dark:bg-warning/20 dark:text-warning',
};

const ROLE_ICONS: Record<string, typeof Shield> = {
    user: Shield,
    moderator: ShieldCheck,
    admin: ShieldAlert,
    superadmin: Crown,
};

const ROLE_LABELS: Record<string, string> = {
    user: 'Användare',
    moderator: 'Moderator',
    admin: 'Admin',
    superadmin: 'Superadmin',
};

export default function AdminUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserWithBanInfo[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithBanInfo | null>(null);
    const [showBanModal, setShowBanModal] = useState(false);
    const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);
    const pageSize = 20;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { users: data, total: count } = await getUsers({
                page,
                pageSize,
                search,
                role: roleFilter,
                showBanned: true,
            });
            setUsers(data);
            setTotal(count);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (currentUser) {
            checkIsSuperadmin(currentUser.id).then(setIsSuperadmin);
        }
    }, [currentUser]);

    const handleBan = (user: UserWithBanInfo) => {
        setSelectedUser(user);
        setShowBanModal(true);
        setActionMenuUser(null);
    };

    const handleUnban = async (userId: string) => {
        if (!currentUser) return;
        try {
            await unbanUser(userId, currentUser.id);
            loadUsers();
        } catch (err) {
            console.error('Failed to unban user:', err);
        }
        setActionMenuUser(null);
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            await updateUserRole(userId, newRole);
            loadUsers();
        } catch (err) {
            console.error('Failed to update role:', err);
            alert(err instanceof Error ? err.message : 'Det gick inte att uppdatera rollen');
        }
        setActionMenuUser(null);
    };

    const handleMembershipChange = async (userId: string, newType: 'free' | 'premium') => {
        try {
            await updateMembershipType(userId, newType);
            loadUsers();
        } catch (err) {
            console.error('Failed to update membership:', err);
            alert(err instanceof Error ? err.message : 'Det gick inte att uppdatera medlemskapet');
        }
        setActionMenuUser(null);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Användarhantering</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">Hantera användare, roller och avstängningar</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 dark:text-surface-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Sök användare..."
                        className="w-full pl-10 pr-4 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value as UserRole | 'all');
                        setPage(1);
                    }}
                    className="px-4 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                    <option value="all">Alla roller</option>
                    <option value="user">Användare</option>
                    <option value="moderator">Moderatorer</option>
                    <option value="admin">Admins</option>
                    <option value="superadmin">Superadmins</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Användare
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Roll
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Medlemskap
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Gick med
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Åtgärder
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-surface-500 dark:text-surface-400">
                                        Laddar...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-surface-500 dark:text-surface-400">
                                        Inga användare hittades
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const RoleIcon = ROLE_ICONS[user.role || 'user'];
                                    const isCurrentUser = user.id === currentUser?.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}`}
                                                        alt={user.display_name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-surface-900 dark:text-surface-100">{user.display_name}</p>
                                                        <p className="text-sm text-surface-500 dark:text-surface-400">@{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role || 'user']}`}>
                                                    <RoleIcon className="w-3.5 h-3.5" />
                                                    {ROLE_LABELS[user.role || 'user'] || (user.role || 'user')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.membership_type === 'premium' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-yellow text-surface-900">
                                                        <Star className="w-3.5 h-3.5" />
                                                        Premium
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                                                        Gratis
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_banned ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error/15 text-surface-900 dark:bg-error/20 dark:text-error-soft">
                                                            <Ban className="w-3.5 h-3.5" />
                                                            Avstängd
                                                        </span>
                                                        {user.ban_expires_at && (
                                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                                                Till {new Date(user.ban_expires_at).toLocaleDateString('sv-SE')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-surface-900 dark:bg-success/20 dark:text-success">
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        Aktiv
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-surface-500 dark:text-surface-400">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('sv-SE') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isCurrentUser && (
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                                                            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                                                        </button>

                                                        {actionMenuUser === user.id && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-surface-800 rounded-lg shadow-elevated dark:shadow-elevated-dark border border-surface-200 dark:border-surface-700 z-10">
                                                                {user.is_banned ? (
                                                                    <button
                                                                        onClick={() => handleUnban(user.id)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-surface-900 dark:text-success hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                                                    >
                                                                        <UserCheck className="w-4 h-4" />
                                                                        Häv avstängning
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleBan(user)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-error-strong dark:text-error-soft hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                                                    >
                                                                        <Ban className="w-4 h-4" />
                                                                        Stäng av användare
                                                                    </button>
                                                                )}
                                                                <hr className="my-1 border-surface-100 dark:border-surface-700" />
                                                                {user.membership_type === 'premium' ? (
                                                                    <button
                                                                        onClick={() => handleMembershipChange(user.id, 'free')}
                                                                        className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                                                    >
                                                                        <Star className="w-4 h-4" />
                                                                        Ta bort premium
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleMembershipChange(user.id, 'premium')}
                                                                        className="w-full px-4 py-2 text-left text-sm text-surface-900 dark:text-warning hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                                                    >
                                                                        <Star className="w-4 h-4" />
                                                                        Gör till premium
                                                                    </button>
                                                                )}
                                                                {isSuperadmin && user.role !== 'superadmin' && (
                                                                    <>
                                                                        <hr className="my-1 border-surface-100 dark:border-surface-700" />
                                                                        <div className="px-4 py-1 text-xs text-surface-500 dark:text-surface-400">Ändra roll</div>
                                                                        {(['user', 'moderator', 'admin'] as UserRole[])
                                                                            .filter((r) => r !== user.role)
                                                                            .map((role) => {
                                                                                const Icon = ROLE_ICONS[role];
                                                                                return (
                                                                                    <button
                                                                                        key={role}
                                                                                        onClick={() => handleRoleChange(user.id, role)}
                                                                                        className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                                                                    >
                                                                                        <Icon className="w-4 h-4" />
                                                                                        Gör till {ROLE_LABELS[role] || role}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Visar {(page - 1) * pageSize + 1} till {Math.min(page * pageSize, total)} av {total} användare
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5 text-surface-700 dark:text-surface-300" />
                            </button>
                            <span className="px-4 py-2 text-sm text-surface-700 dark:text-surface-300">
                                Sida {page} av {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-surface-700 dark:text-surface-300" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Ban Modal */}
            {showBanModal && selectedUser && currentUser && (
                <BanUserModal
                    user={selectedUser}
                    adminUserId={currentUser.id}
                    onClose={() => {
                        setShowBanModal(false);
                        setSelectedUser(null);
                    }}
                    onBanned={loadUsers}
                />
            )}
        </div>
    );
}
