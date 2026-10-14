import { useEffect, useState } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    X,
    Check,
    Tag,
} from 'lucide-react';
import {
    getAdminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../../services';
import type { Category } from '../../types/database';

// Kategorifärger ur Aktiespararnas grafiska profil 2023 (se docs/redesign/designsystem.md)
const PRESET_COLORS = [
    '#185DA9', // Blå (brand-blue)
    '#32D7CD', // Blågrön (brand-teal)
    '#652FA0', // Lila (brand-purple)
    '#F5A118', // Orange (brand-orange)
    '#EC5345', // Röd (brand-red)
    '#EE0181', // Rosa (brand-pink)
    '#159EDA', // Himmelsblå (brand-sky)
    '#973B8E', // Plommonlila (brand-plum)
];

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', color: '', icon: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', color: '#185DA9', icon: '' });
    const [saving, setSaving] = useState(false);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await getAdminCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleCreate = async () => {
        if (!newCategory.name.trim()) return;
        setSaving(true);
        try {
            await createCategory({
                name: newCategory.name.trim(),
                slug: generateSlug(newCategory.name),
                color: newCategory.color,
                icon: newCategory.icon || undefined,
            });
            setNewCategory({ name: '', color: '#185DA9', icon: '' });
            setIsCreating(false);
            loadCategories();
        } catch (err) {
            console.error('Failed to create category:', err);
            alert('Det gick inte att skapa kategorin');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setEditForm({
            name: category.name,
            color: category.color || '#185DA9',
            icon: category.icon || '',
        });
    };

    const handleSaveEdit = async (categoryId: string) => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        try {
            await updateCategory(categoryId, {
                name: editForm.name.trim(),
                slug: generateSlug(editForm.name),
                color: editForm.color,
                icon: editForm.icon || null,
            });
            setEditingId(null);
            loadCategories();
        } catch (err) {
            console.error('Failed to update category:', err);
            alert('Det gick inte att uppdatera kategorin');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (categoryId: string) => {
        if (!confirm('Är du säker på att du vill ta bort den här kategorin? Inlägg som använder den blir okategoriserade.')) {
            return;
        }
        try {
            await deleteCategory(categoryId);
            loadCategories();
        } catch (err) {
            console.error('Failed to delete category:', err);
            alert('Det gick inte att ta bort kategorin');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Kategorihantering</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">Hantera kategorier för inlägg</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Lägg till kategori
                    </button>
                )}
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Ny kategori</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Namn</label>
                            <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                placeholder="Kategorinamn"
                                className="w-full px-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Färg</label>
                            <div className="flex gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewCategory({ ...newCategory, color })}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color ? 'border-surface-900 dark:border-surface-100 scale-110' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={newCategory.color}
                                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                    className="w-8 h-8 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Ikon (valfritt)</label>
                            <input
                                type="text"
                                value={newCategory.icon}
                                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                placeholder="t.ex. 📚 eller ikonnamn"
                                className="w-full px-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCreate}
                                disabled={saving || !newCategory.name.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                {saving ? 'Skapar...' : 'Skapa'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewCategory({ name: '', color: '#185DA9', icon: '' });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Avbryt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories List */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-surface-500 dark:text-surface-400">Laddar...</div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-surface-500 dark:text-surface-400">
                        <Tag className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                        <p>Inga kategorier ännu</p>
                        <p className="text-sm mt-1">Skapa din första kategori för att organisera inlägg</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-surface-100 dark:divide-surface-700">
                        {categories.map((category) => (
                            <li key={category.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800">
                                {editingId === category.id ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500"
                                            />
                                            <input
                                                type="color"
                                                value={editForm.color}
                                                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                                className="w-10 h-10 rounded cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(category.id)}
                                                disabled={saving}
                                                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                                            >
                                                Spara
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700"
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <GripVertical className="w-5 h-5 text-surface-300 dark:text-surface-600 cursor-move" />
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: category.color || 'var(--color-primary-600, #185DA9)' }}
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-surface-900 dark:text-surface-100">
                                                {category.icon && <span className="mr-2">{category.icon}</span>}
                                                {category.name}
                                            </p>
                                            <p className="text-sm text-surface-500 dark:text-surface-400">/{category.slug}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                                                title="Redigera"
                                            >
                                                <Edit2 className="w-4 h-4 text-surface-500 dark:text-surface-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 hover:bg-error/10 dark:hover:bg-error/20 rounded-lg transition-colors"
                                                title="Ta bort"
                                            >
                                                <Trash2 className="w-4 h-4 text-error-strong dark:text-error-soft" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
