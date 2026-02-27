'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { productsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles, ArrowRight, Upload, X, PenTool } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    icon: string;
}

const CONDITIONS = [
    { id: 'new', label: 'New', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { id: 'like_new', label: 'Like New', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { id: 'good', label: 'Good', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { id: 'fair', label: 'Fair', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    { id: 'poor', label: 'Poor', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('good');

    // Existing URLs from DB
    const [existingImages, setExistingImages] = useState<string[]>([]);
    // New files to upload
    const [newImages, setNewImages] = useState<File[]>([]);
    // Previews for new files
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchInitialData = async () => {
            if (!user) return;
            try {
                // Fetch Categories
                const { data: catData } = await supabase.from('categories').select('*');
                if (catData) setCategories(catData);

                // Fetch Product
                const { data: productData } = await productsApi.getOne(id);
                const product = productData.product;

                if (!product) {
                    setError('Product not found');
                    return;
                }

                // Check authorization
                if (product.seller_id !== user.id) {
                    router.push('/');
                    return;
                }

                setTitle(product.title);
                setPrice(product.price.toString());
                setDescription(product.description || '');
                setCategoryId(product.category_id);
                setCondition(product.condition);
                setExistingImages(product.images || []);

                setLoading(false);
            } catch (err) {
                setError('Failed to load product details');
                setLoading(false);
            }
        };

        if (user) {
            fetchInitialData();
        }
    }, [user, authLoading, router, id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImages = existingImages.length + newImages.length + files.length;

            if (totalImages > 5) {
                setError('Maximum 5 images allowed');
                return;
            }

            setNewImages(prev => [...prev, ...files]);

            // Create previews
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate product ID
        if (!id) {
            setError('Missing product ID');
            return;
        }

        if (!title.trim() || !price || !categoryId) return setError('Please fill in all required fields');

        setSaving(true);
        try {
            // 1. Upload new images
            const uploadedUrls: string[] = [];

            for (const file of newImages) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }

            // 2. Combine URLs
            const finalImages = [...existingImages, ...uploadedUrls];

            // 3. Update Product — sanitize price to pure number
            const sanitizedPrice = Number(String(price).replace(/[^0-9.-]+/g, ''));
            const payload = {
                title: title.trim(),
                price: sanitizedPrice,
                description: description.trim(),
                category_id: categoryId,
                condition,
                images: finalImages,
            };
            await productsApi.update(id, payload);

            router.push(`/product/${id}`);
            router.refresh();
        } catch (err: any) {
            const msg = err?.message || 'Failed to update listing';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !title) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-visible py-24">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--neon-purple)] opacity-10 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[var(--neon-blue)] opacity-10 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-2xl relative z-10 animate-slide-up">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <div className="p-2 rounded-xl glass inline-flex">
                            <PenTool className="w-6 h-6 text-[var(--neon-purple)]" />
                        </div>
                        Edit Listing
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Update your product details
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="glass-heavy rounded-2xl p-6 space-y-5">
                        <GlassInput
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What are you selling?"
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Description <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                className="glass-input w-full px-4 py-3 text-sm resize-none rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Price & Category */}
                    <div className="glass-heavy rounded-2xl p-6 space-y-5">
                        <GlassInput
                            label="Price (₹)"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />

                        <div>
                            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                Category
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryId(cat.id)}
                                        className={`p-3 rounded-xl border transition-all text-sm flex flex-col items-center gap-2 ${categoryId === cat.id
                                            ? 'glass border-[var(--neon-purple)] bg-[rgba(168,85,247,0.1)] text-white'
                                            : 'glass border-transparent text-[var(--text-muted)] hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-xl">{cat.icon}</span>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                Condition
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {CONDITIONS.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCondition(c.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${condition === c.id
                                            ? `${c.bg} ${c.color} ${c.border}`
                                            : 'glass border-transparent text-[var(--text-muted)] hover:bg-white/5'
                                            }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="glass-heavy rounded-2xl p-6">
                        <label className="block text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Photos ({existingImages.length + newImages.length}/5)
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {/* Upload Button */}
                            {(existingImages.length + newImages.length) < 5 && (
                                <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[var(--neon-purple)] hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:text-white group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <div className="p-3 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium">Add Photo</span>
                                </label>
                            )}

                            {/* Existing Images */}
                            {existingImages.map((url, i) => (
                                <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                                    <img src={url} alt={`Existing ${i}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(i)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-black/50 text-white">
                                        Active
                                    </div>
                                </div>
                            ))}

                            {/* New Images */}
                            {newImagePreviews.map((url, i) => (
                                <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                                    <img src={url} alt={`New ${i}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(i)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-[var(--neon-green)] text-black font-bold">
                                        New
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl text-xs text-red-300 bg-red-500/10 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <GlassButton
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 opacity-70 hover:opacity-100"
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            loading={saving}
                            icon={!saving ? <ArrowRight className="w-5 h-5" /> : undefined}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </GlassButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
