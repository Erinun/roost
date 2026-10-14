import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { ChevronDown, ChevronUp, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import {
    updateAssociation,
    getAssociationMembers,
    updateMemberRole,
    removeAssociationMember,
    addAssociationMember,
    searchProfiles,
    getWorkgroups,
    createWorkgroup,
    deleteWorkgroup,
    getWorkgroupMembers,
    addWorkgroupMember,
    removeWorkgroupMember,
} from '@/services/association';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type {
    Association,
    AssociationMember,
    AssociationRole,
    AssociationWorkgroup,
    ProfileSummary,
} from '@/types/association';

const ROLE_LABELS: Record<AssociationRole, string> = {
    admin: 'Administratör',
    internal: 'Intern',
    member: 'Medlem',
};

const ROLE_OPTIONS: AssociationRole[] = ['admin', 'internal', 'member'];

function profileName(profile?: ProfileSummary | null): string {
    return profile?.display_name || profile?.username || 'Okänd användare';
}

function MemberAvatar({ profile }: { profile?: ProfileSummary | null }) {
    const name = profileName(profile);
    return (
        <div className="avatar-sm flex-shrink-0">
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
            )}
        </div>
    );
}

// ─── Föreningsinfo ─────────────────────────────────────────────────

interface AssociationInfoSectionProps {
    association: Association;
    onAssociationUpdated: (association: Association) => void;
}

function AssociationInfoSection({ association, onAssociationUpdated }: AssociationInfoSectionProps) {
    const [name, setName] = useState(association.name);
    const [description, setDescription] = useState(association.description ?? '');
    const [contactInfo, setContactInfo] = useState(association.contact_info ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        setError(null);
        setIsSaved(false);

        try {
            const updated = await updateAssociation(association.id, {
                name: name.trim(),
                description: description.trim() || null,
                contact_info: contactInfo.trim() || null,
            });
            setIsSaved(true);
            // Uppdatera arbetsytans sidhuvud med serversvaret
            onAssociationUpdated(updated);
        } catch (err) {
            console.error('Error updating association:', err);
            setError('Det gick inte att spara ändringarna.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Föreningsinfo
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="alert-error">{error}</div>}
                {isSaved && <div className="alert-success">Ändringarna har sparats.</div>}

                <div>
                    <label htmlFor="settings-name" className="label">
                        Namn *
                    </label>
                    <input
                        type="text"
                        id="settings-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setIsSaved(false);
                        }}
                        className="input"
                        required
                        minLength={2}
                        maxLength={100}
                    />
                </div>

                <div>
                    <label htmlFor="settings-description" className="label">
                        Beskrivning
                    </label>
                    <textarea
                        id="settings-description"
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            setIsSaved(false);
                        }}
                        placeholder="Vad gör föreningen?"
                        rows={3}
                        className="input resize-none"
                    />
                </div>

                <div>
                    <label htmlFor="settings-contact" className="label">
                        Kontaktinfo
                    </label>
                    <textarea
                        id="settings-contact"
                        value={contactInfo}
                        onChange={(e) => {
                            setContactInfo(e.target.value);
                            setIsSaved(false);
                        }}
                        placeholder="E-post, telefon eller annan kontaktväg"
                        rows={2}
                        className="input resize-none"
                    />
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                        Kontaktinfon visas för medlemmarna i medlemsportalen.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving || !name.trim()} className="btn-primary">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Spara ändringar
                    </button>
                </div>
            </form>
        </section>
    );
}

// ─── Medlemmar ─────────────────────────────────────────────────────

interface MembersSectionProps {
    associationId: string;
    userId: string;
    members: AssociationMember[];
    setMembers: React.Dispatch<React.SetStateAction<AssociationMember[]>>;
    isLoading: boolean;
    loadError: string | null;
}

function MembersSection({ associationId, userId, members, setMembers, isLoading, loadError }: MembersSectionProps) {
    const [actionError, setActionError] = useState<string | null>(null);

    // Lägg till medlem: sökning + roll
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ProfileSummary[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [newMemberRole, setNewMemberRole] = useState<AssociationRole>('member');
    const [isAdding, setIsAdding] = useState(false);

    const debouncedSearch = useMemo(
        () =>
            debounce(async (query: string) => {
                if (query.trim().length < 2) {
                    setSearchResults([]);
                    setIsSearching(false);
                    return;
                }

                setIsSearching(true);
                try {
                    setSearchResults(await searchProfiles(query.trim()));
                } catch (error) {
                    console.error('Error searching profiles:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300),
        []
    );

    useEffect(() => {
        if (searchQuery) {
            debouncedSearch(searchQuery);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }

        return () => {
            debouncedSearch.cancel();
        };
    }, [searchQuery, debouncedSearch]);

    const memberUserIds = useMemo(() => new Set(members.map(m => m.user_id)), [members]);
    const visibleResults = searchResults.filter(profile => !memberUserIds.has(profile.id));

    const adminCount = members.filter(m => m.role === 'admin').length;

    const handleRoleChange = async (memberId: string, role: AssociationRole) => {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        if (member.role === 'admin' && role !== 'admin') {
            // Spärr: föreningen får inte lämnas utan administratör
            if (adminCount <= 1) {
                setActionError('Föreningen måste ha minst en administratör.');
                // Tvinga en omritning så att rollväljaren återgår till den sparade rollen
                setMembers(prev => [...prev]);
                return;
            }

            // Varning när användaren tar bort sin egen administratörsroll
            if (
                member.user_id === userId &&
                !window.confirm(
                    'Du håller på att ta bort din egen administratörsbehörighet och förlorar då åtkomsten till inställningarna. Vill du fortsätta?'
                )
            ) {
                // Tvinga en omritning så att rollväljaren återgår till den sparade rollen
                setMembers(prev => [...prev]);
                return;
            }
        }

        setActionError(null);
        try {
            await updateMemberRole(memberId, role);
            setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, role } : m)));
        } catch (error) {
            console.error('Error updating member role:', error);
            setActionError('Det gick inte att uppdatera rollen.');
        }
    };

    const handleRemove = async (member: AssociationMember) => {
        // Spärr: föreningen får inte lämnas utan administratör
        if (member.role === 'admin' && adminCount <= 1) {
            setActionError('Föreningen måste ha minst en administratör.');
            return;
        }

        const confirmMessage =
            member.user_id === userId
                ? 'Du håller på att ta bort dig själv ur föreningen och förlorar då åtkomsten till inställningarna. Vill du fortsätta?'
                : `Vill du ta bort ${profileName(member.profile)} ur föreningen?`;
        if (!window.confirm(confirmMessage)) return;

        setActionError(null);
        try {
            await removeAssociationMember(member.id);
            setMembers(prev => prev.filter(m => m.id !== member.id));
        } catch (error) {
            console.error('Error removing association member:', error);
            setActionError('Det gick inte att ta bort medlemmen.');
        }
    };

    const handleAdd = async (profile: ProfileSummary) => {
        setActionError(null);
        setIsAdding(true);
        try {
            const newMember = await addAssociationMember(associationId, profile.id, newMemberRole);
            setMembers(prev => [...prev, { ...newMember, profile }]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding association member:', error);
            setActionError('Det gick inte att lägga till medlemmen.');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <section className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Medlemmar
            </h3>

            {loadError && <div className="alert-error mb-4">{loadError}</div>}
            {actionError && <div className="alert-error mb-4">{actionError}</div>}

            {/* Lägg till medlem */}
            <div className="mb-6">
                <label htmlFor="member-search" className="label">
                    Lägg till medlem
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none" />
                        <input
                            type="text"
                            id="member-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Sök på namn eller användarnamn..."
                            className="input pl-10 pr-10"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                                aria-label="Rensa sökningen"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div>
                        <label htmlFor="new-member-role" className="sr-only">
                            Roll för ny medlem
                        </label>
                        <select
                            id="new-member-role"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as AssociationRole)}
                            className="input w-full sm:w-auto"
                        >
                            {ROLE_OPTIONS.map(role => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sökresultat */}
                {searchQuery.trim().length >= 2 && (
                    <div className="mt-2 border border-surface-200 dark:border-surface-700 rounded-lg divide-y divide-surface-100 dark:divide-surface-700">
                        {isSearching ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                            </div>
                        ) : visibleResults.length === 0 ? (
                            <p className="p-4 text-sm text-surface-500 dark:text-surface-400">
                                Inga användare hittades.
                            </p>
                        ) : (
                            visibleResults.map(profile => (
                                <button
                                    key={profile.id}
                                    type="button"
                                    onClick={() => handleAdd(profile)}
                                    disabled={isAdding}
                                    className="w-full flex items-center gap-3 p-3 min-h-11 text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors first:rounded-t-lg last:rounded-b-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 disabled:cursor-not-allowed"
                                >
                                    <MemberAvatar profile={profile} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                                            {profileName(profile)}
                                        </p>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                                            @{profile.username}
                                        </p>
                                    </div>
                                    <Plus className="w-5 h-5 text-primary-600 dark:text-primary-300 flex-shrink-0" />
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Medlemstabell */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            ) : members.length === 0 ? (
                <p className="text-surface-600 dark:text-surface-300 py-4">
                    Föreningen har inga medlemmar än.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-200 dark:border-surface-700">
                                <th className="py-2 pr-4 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Namn
                                </th>
                                <th className="py-2 pr-4 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Roll
                                </th>
                                <th className="py-2 text-right text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                    Åtgärder
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                            {members.map(member => (
                                <tr key={member.id}>
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-3">
                                            <MemberAvatar profile={member.profile} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                                                    {profileName(member.profile)}
                                                </p>
                                                {member.profile?.username && (
                                                    <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                                                        @{member.profile.username}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <label htmlFor={`member-role-${member.id}`} className="sr-only">
                                            Roll för {profileName(member.profile)}
                                        </label>
                                        <select
                                            id={`member-role-${member.id}`}
                                            value={member.role}
                                            onChange={(e) =>
                                                handleRoleChange(member.id, e.target.value as AssociationRole)
                                            }
                                            className="input w-auto"
                                        >
                                            {ROLE_OPTIONS.map(role => (
                                                <option key={role} value={role}>
                                                    {ROLE_LABELS[role]}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => handleRemove(member)}
                                            className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-surface-500 dark:text-surface-400 hover:text-error-strong hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                                            aria-label={`Ta bort ${profileName(member.profile)}`}
                                            title="Ta bort medlem"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

// ─── Arbetsgrupper ─────────────────────────────────────────────────

type WorkgroupWithMembers = AssociationWorkgroup & { members: ProfileSummary[] };

interface WorkgroupsSectionProps {
    associationId: string;
    userId: string;
    internalMembers: AssociationMember[];
}

function WorkgroupsSection({ associationId, userId, internalMembers }: WorkgroupsSectionProps) {
    const [workgroups, setWorkgroups] = useState<WorkgroupWithMembers[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [addUserId, setAddUserId] = useState('');

    useEffect(() => {
        const fetchWorkgroups = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const groups = await getWorkgroups(associationId);
                const groupMembers = await Promise.all(
                    groups.map(group => getWorkgroupMembers(group.id))
                );
                setWorkgroups(groups.map((group, i) => ({ ...group, members: groupMembers[i] })));
            } catch (err) {
                console.error('Error fetching workgroups:', err);
                setError('Det gick inte att hämta arbetsgrupperna.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkgroups();
    }, [associationId]);

    const toggleGroup = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
        setAddUserId('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setIsCreating(true);
        setError(null);
        try {
            const workgroup = await createWorkgroup({
                association_id: associationId,
                name: newGroupName.trim(),
                created_by: userId,
            });
            setWorkgroups(prev =>
                [...prev, { ...workgroup, members: [] }].sort((a, b) =>
                    a.name.localeCompare(b.name, 'sv')
                )
            );
            setNewGroupName('');
        } catch (err) {
            console.error('Error creating workgroup:', err);
            setError('Det gick inte att skapa arbetsgruppen.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteGroup = async (group: WorkgroupWithMembers) => {
        if (!window.confirm(`Vill du ta bort arbetsgruppen "${group.name}"?`)) return;

        setError(null);
        try {
            await deleteWorkgroup(group.id);
            setWorkgroups(prev => prev.filter(g => g.id !== group.id));
            if (expandedId === group.id) setExpandedId(null);
        } catch (err) {
            console.error('Error deleting workgroup:', err);
            setError('Det gick inte att ta bort arbetsgruppen.');
        }
    };

    const handleAddMember = async (group: WorkgroupWithMembers) => {
        const profile = internalMembers.find(m => m.user_id === addUserId)?.profile;
        if (!addUserId || !profile) return;

        setError(null);
        try {
            await addWorkgroupMember(group.id, addUserId);
            setWorkgroups(prev =>
                prev.map(g => (g.id === group.id ? { ...g, members: [...g.members, profile] } : g))
            );
            setAddUserId('');
        } catch (err) {
            console.error('Error adding workgroup member:', err);
            setError('Det gick inte att lägga till medlemmen i arbetsgruppen.');
        }
    };

    const handleRemoveMember = async (group: WorkgroupWithMembers, profile: ProfileSummary) => {
        setError(null);
        try {
            await removeWorkgroupMember(group.id, profile.id);
            setWorkgroups(prev =>
                prev.map(g =>
                    g.id === group.id
                        ? { ...g, members: g.members.filter(m => m.id !== profile.id) }
                        : g
                )
            );
        } catch (err) {
            console.error('Error removing workgroup member:', err);
            setError('Det gick inte att ta bort medlemmen ur arbetsgruppen.');
        }
    };

    return (
        <section className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Arbetsgrupper
            </h3>

            {error && <div className="alert-error mb-4">{error}</div>}

            {/* Skapa arbetsgrupp */}
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1">
                    <label htmlFor="new-workgroup-name" className="sr-only">
                        Namn på ny arbetsgrupp
                    </label>
                    <input
                        type="text"
                        id="new-workgroup-name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Namn på ny arbetsgrupp..."
                        className="input"
                        maxLength={100}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isCreating || !newGroupName.trim()}
                    className="btn-primary flex-shrink-0"
                >
                    {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                    Skapa arbetsgrupp
                </button>
            </form>

            {/* Grupplista */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            ) : workgroups.length === 0 ? (
                <p className="text-surface-600 dark:text-surface-300 py-4">
                    Inga arbetsgrupper än.
                </p>
            ) : (
                <div className="space-y-3">
                    {workgroups.map(group => {
                        const isExpanded = expandedId === group.id;
                        const Chevron = isExpanded ? ChevronUp : ChevronDown;
                        const groupMemberIds = new Set(group.members.map(m => m.id));
                        const eligibleMembers = internalMembers.filter(
                            m => m.profile && !groupMemberIds.has(m.user_id)
                        );

                        return (
                            <div
                                key={group.id}
                                className="border border-surface-200 dark:border-surface-700 rounded-lg"
                            >
                                {/* Grupprad */}
                                <div className="flex items-center gap-2 p-3">
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="flex-1 flex items-center gap-3 min-h-11 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
                                        aria-expanded={isExpanded}
                                    >
                                        <Chevron className="w-5 h-5 text-surface-400 dark:text-surface-500 flex-shrink-0" />
                                        <span className="font-medium text-surface-900 dark:text-surface-50">
                                            {group.name}
                                        </span>
                                        <span className="text-sm text-surface-500 dark:text-surface-400">
                                            {group.members.length === 1
                                                ? '1 medlem'
                                                : `${group.members.length} medlemmar`}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(group)}
                                        className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-surface-500 dark:text-surface-400 hover:text-error-strong hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                                        aria-label={`Ta bort arbetsgruppen ${group.name}`}
                                        title="Ta bort arbetsgrupp"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Expanderad vy: medlemmar + lägg till */}
                                {isExpanded && (
                                    <div className="border-t border-surface-200 dark:border-surface-700 p-3 space-y-3">
                                        {group.members.length === 0 ? (
                                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                                Arbetsgruppen har inga medlemmar än.
                                            </p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {group.members.map(profile => (
                                                    <li
                                                        key={profile.id}
                                                        className="flex items-center gap-3 py-1"
                                                    >
                                                        <MemberAvatar profile={profile} />
                                                        <span className="flex-1 min-w-0 text-sm text-surface-900 dark:text-surface-50 truncate">
                                                            {profileName(profile)}
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoveMember(group, profile)}
                                                            className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-surface-500 dark:text-surface-400 hover:text-error-strong hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                                                            aria-label={`Ta bort ${profileName(profile)} ur arbetsgruppen`}
                                                            title="Ta bort ur arbetsgruppen"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Lägg till medlem i gruppen */}
                                        {eligibleMembers.length === 0 ? (
                                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                                Alla interna medlemmar är redan med i arbetsgruppen.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="flex-1">
                                                    <label
                                                        htmlFor={`workgroup-add-${group.id}`}
                                                        className="sr-only"
                                                    >
                                                        Välj medlem att lägga till
                                                    </label>
                                                    <select
                                                        id={`workgroup-add-${group.id}`}
                                                        value={addUserId}
                                                        onChange={(e) => setAddUserId(e.target.value)}
                                                        className="input"
                                                    >
                                                        <option value="">Välj medlem...</option>
                                                        {eligibleMembers.map(member => (
                                                            <option key={member.user_id} value={member.user_id}>
                                                                {profileName(member.profile)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => handleAddMember(group)}
                                                    disabled={!addUserId}
                                                    className="btn-secondary flex-shrink-0"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Lägg till
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

// ─── Huvudkomponent ────────────────────────────────────────────────

interface AdminSettingsProps {
    association: Association;
    userId: string;
    onAssociationUpdated: (association: Association) => void;
}

function AdminSettings({ association, userId, onAssociationUpdated }: AdminSettingsProps) {
    const [members, setMembers] = useState<AssociationMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setIsLoadingMembers(true);
        setMembersError(null);
        try {
            setMembers(await getAssociationMembers(association.id));
        } catch (error) {
            console.error('Error fetching association members:', error);
            setMembersError('Det gick inte att hämta medlemmarna.');
        } finally {
            setIsLoadingMembers(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Interna medlemmar (admin + intern) kan läggas till i arbetsgrupper
    const internalMembers = members.filter(m => m.role !== 'member');

    return (
        <div className="space-y-6">
            <AssociationInfoSection
                association={association}
                onAssociationUpdated={onAssociationUpdated}
            />
            <MembersSection
                associationId={association.id}
                userId={userId}
                members={members}
                setMembers={setMembers}
                isLoading={isLoadingMembers}
                loadError={membersError}
            />
            <WorkgroupsSection
                associationId={association.id}
                userId={userId}
                internalMembers={internalMembers}
            />
        </div>
    );
}

export default function WorkspaceSettings() {
    const { association, role, userId, onAssociationUpdated } = useOutletContext<WorkspaceContext>();

    if (role !== 'admin') {
        return (
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                    Inställningar
                </h2>
                <p className="text-surface-600 dark:text-surface-300">
                    Endast administratörer kan hantera föreningens inställningar.
                </p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Inställningar
            </h2>
            <AdminSettings
                association={association}
                userId={userId}
                onAssociationUpdated={onAssociationUpdated}
            />
        </div>
    );
}
