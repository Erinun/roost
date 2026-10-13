import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2, AlertTriangle, LayoutGrid, Sidebar as SidebarIcon, GraduationCap, Crown, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getGroupBySlug, updateGroup, deleteGroup, hasPermission } from '@/services/group';
import type { GroupWithDetails } from '@/services/group';
import { GroupMembers, CreateGroupModal } from '@/components/groups';
import type { Group } from '@/types';

export default function GroupSettings() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState<GroupWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingLayout, setIsUpdatingLayout] = useState(false);
    const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchGroup = useCallback(async () => {
        if (!slug) return;

        try {
            setIsLoading(true);
            setError(null);
            const data = await getGroupBySlug(slug, user?.id);
            if (!data) {
                setError('Klassrummet hittades inte');
            } else if (!hasPermission(data.user_role, 'edit_settings')) {
                setError('Du har inte behörighet att redigera det här klassrummet');
            } else {
                setGroup(data);
            }
        } catch (err) {
            console.error('Error fetching group:', err);
            setError('Det gick inte att ladda klassrummet');
        } finally {
            setIsLoading(false);
        }
    }, [slug, user?.id]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    const handleEditSuccess = (updatedGroup: Group) => {
        // If slug changed, navigate to new URL
        if (updatedGroup.slug !== slug) {
            navigate(`/classrooms/${updatedGroup.slug}/settings`, { replace: true });
        }
        fetchGroup();
    };

    const handleLayoutChange = async (newLayout: 'default' | 'sidebar' | 'learn') => {
        if (!group) return;

        try {
            setIsUpdatingLayout(true);
            await updateGroup(group.id, { layout_mode: newLayout });
            fetchGroup();
        } catch (err) {
            console.error('Error updating layout:', err);
            alert('Det gick inte att uppdatera layouten');
        } finally {
            setIsUpdatingLayout(false);
        }
    };

    const handleAccessTypeChange = async (isPremium: boolean) => {
        if (!group) return;

        try {
            setIsUpdatingAccess(true);
            await updateGroup(group.id, { is_premium: isPremium });
            fetchGroup();
        } catch (err) {
            console.error('Error updating access type:', err);
            alert('Det gick inte att uppdatera åtkomsttypen');
        } finally {
            setIsUpdatingAccess(false);
        }
    };

    const handleDelete = async () => {
        if (!group || deleteConfirmText !== group.name) return;

        try {
            setIsDeleting(true);
            await deleteGroup(group.id);
            navigate('/classrooms', { replace: true });
        } catch (err) {
            console.error('Error deleting group:', err);
            alert('Det gick inte att ta bort klassrummet');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                        {error || 'Klassrummet hittades inte'}
                    </h2>
                    <button
                        onClick={() => navigate('/classrooms')}
                        className="btn-secondary mt-4"
                    >
                        Bläddra bland klassrum
                    </button>
                </div>
            </div>
        );
    }

    const canDelete = hasPermission(group.user_role, 'delete_group');

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/classrooms/${group.slug}`)}
                    className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                    <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Klassrumsinställningar</h1>
                    <p className="text-surface-600 dark:text-surface-300">{group.name}</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* General Settings */}
                <section className="card">
                    <div className="p-6 border-b border-surface-200 dark:border-surface-700">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Allmänt</h2>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                            Hantera klassrummets grundläggande information
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            {group.avatar_url ? (
                                <img
                                    src={group.avatar_url}
                                    alt={group.name}
                                    className="w-16 h-16 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="font-medium text-surface-900 dark:text-surface-100">{group.name}</h3>
                                <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                                    {group.description || 'Ingen beskrivning'}
                                </p>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                                    /classrooms/{group.slug}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="btn-secondary"
                            >
                                Redigera
                            </button>
                        </div>
                    </div>
                </section>

                {/* Layout Settings */}
                <section className="card">
                    <div className="p-6 border-b border-surface-200 dark:border-surface-700">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Layout</h2>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                            Välj layout för klassrummets sida
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Default Layout */}
                            <button
                                onClick={() => handleLayoutChange('default')}
                                disabled={isUpdatingLayout}
                                className={`
                                    relative p-4 rounded-lg border-2 transition-all text-left
                                    ${group.layout_mode === 'default'
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <LayoutGrid className={`w-5 h-5 mt-0.5 ${group.layout_mode === 'default' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'}`} />
                                    <div>
                                        <h3 className={`font-medium ${group.layout_mode === 'default' ? 'text-primary-900 dark:text-primary-100' : 'text-surface-900 dark:text-surface-100'}`}>
                                            Standardlayout
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            Sidhuvud överst, flikar under, innehåll i rutnät
                                        </p>
                                    </div>
                                </div>
                                {group.layout_mode === 'default' && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Sidebar Layout */}
                            <button
                                onClick={() => handleLayoutChange('sidebar')}
                                disabled={isUpdatingLayout}
                                className={`
                                    relative p-4 rounded-lg border-2 transition-all text-left
                                    ${group.layout_mode === 'sidebar'
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <SidebarIcon className={`w-5 h-5 mt-0.5 ${group.layout_mode === 'sidebar' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'}`} />
                                    <div>
                                        <h3 className={`font-medium ${group.layout_mode === 'sidebar' ? 'text-primary-900 dark:text-primary-100' : 'text-surface-900 dark:text-surface-100'}`}>
                                            Layout med sidopanel
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            Sidhuvud i höger sidopanel, flikar i linje med innehållet
                                        </p>
                                    </div>
                                </div>
                                {group.layout_mode === 'sidebar' && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Learn Mode Layout */}
                            <button
                                onClick={() => handleLayoutChange('learn')}
                                disabled={isUpdatingLayout}
                                className={`
                                    relative p-4 rounded-lg border-2 transition-all text-left
                                    ${group.layout_mode === 'learn'
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <GraduationCap className={`w-5 h-5 mt-0.5 ${group.layout_mode === 'learn' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'}`} />
                                    <div>
                                        <h3 className={`font-medium ${group.layout_mode === 'learn' ? 'text-primary-900 dark:text-primary-100' : 'text-surface-900 dark:text-surface-100'}`}>
                                            Lärläge
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            Kursliknande layout med moduler, lektioner och framstegsspårning
                                        </p>
                                    </div>
                                </div>
                                {group.layout_mode === 'learn' && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Access Type Settings */}
                <section className="card">
                    <div className="p-6 border-b border-surface-200 dark:border-surface-700">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Åtkomsttyp</h2>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                            Styr vem som kan komma åt det här klassrummet
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Free Access */}
                            <button
                                onClick={() => handleAccessTypeChange(false)}
                                disabled={isUpdatingAccess}
                                className={`
                                    relative p-4 rounded-lg border-2 transition-all text-left
                                    ${!group.is_premium
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <Users className={`w-5 h-5 mt-0.5 ${!group.is_premium ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'}`} />
                                    <div>
                                        <h3 className={`font-medium ${!group.is_premium ? 'text-primary-900 dark:text-primary-100' : 'text-surface-900 dark:text-surface-100'}`}>
                                            Fri åtkomst
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            Alla medlemmar kan gå med i det här klassrummet
                                        </p>
                                    </div>
                                </div>
                                {!group.is_premium && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Premium Only */}
                            <button
                                onClick={() => handleAccessTypeChange(true)}
                                disabled={isUpdatingAccess}
                                className={`
                                    relative p-4 rounded-lg border-2 transition-all text-left
                                    ${group.is_premium
                                        ? 'border-warning bg-warning/10 dark:bg-warning/15'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <Crown className={`w-5 h-5 mt-0.5 ${group.is_premium ? 'text-surface-900 dark:text-warning' : 'text-surface-400 dark:text-surface-500'}`} />
                                    <div>
                                        <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                            Endast premium
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            Endast premiummedlemmar har åtkomst
                                        </p>
                                    </div>
                                </div>
                                {group.is_premium && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-brand-yellow rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-surface-900" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Members Management */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Medlemmar</h2>
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                            Hantera klassrummets medlemmar och deras roller
                        </p>
                    </div>
                    <GroupMembers
                        groupId={group.id}
                        userRole={group.user_role}
                        compact={false}
                        limit={50}
                        onMemberChange={fetchGroup}
                    />
                </section>

                {/* Danger Zone */}
                {canDelete && (
                    <section className="card border-error/60 dark:border-error/40 overflow-hidden">
                        <div className="p-6 border-b border-error/30 bg-error/10 dark:bg-error/15">
                            <h2 className="text-lg font-semibold text-error-strong dark:text-error-soft flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Farozon
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-medium text-surface-900 dark:text-surface-100">Ta bort det här klassrummet</h3>
                                    <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                                        När du tar bort ett klassrum går det inte att ångra. Alla inlägg, kommentarer och medlemsdata raderas permanent.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="btn-danger flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Ta bort klassrum
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Edit Modal */}
            <CreateGroupModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                editingGroup={group}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-md p-6">
                        <div className="flex items-center gap-3 text-error-strong dark:text-error-soft mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h2 className="text-xl font-semibold">Ta bort klassrum</h2>
                        </div>
                        <p className="text-surface-600 dark:text-surface-300 mb-4">
                            Den här åtgärden kan inte ångras. Detta raderar permanent klassrummet
                            <strong> {group.name} </strong>
                            och allt dess innehåll.
                        </p>
                        <p className="text-surface-600 dark:text-surface-300 mb-4">
                            Skriv <strong>{group.name}</strong> för att bekräfta.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder={group.name}
                            className="input mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                }}
                                className="btn-secondary flex-1"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== group.name || isDeleting}
                                className="btn-danger flex-1"
                            >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Ta bort klassrum
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
