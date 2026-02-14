'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { productsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
    ImagePlus, X, IndianRupee, Tag, Package,
    Sparkles, ArrowLeft, Upload, CheckCircle
} from 'lucide-react';

const CATEGORIES = [
    { id: '', name: 'Select a category', icon: '' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'electronics', name: 'Electronics', icon: '💻' },
    { id: 'hostel-gear', name: 'Hostel Gear', icon: '🏠' },
    { id: 'notes', name: 'Notes', icon: '📝' },
];

const CONDITIONS = [
    { value: '', label: 'Select condition' },
    { value: 'new', label: 'Brand New — Unused, in original packaging' },
    { value: 'like_new', label: 'Like New — Barely used, no visible wear' },
    { value: 'good', label: 'Good — Minor signs of use, fully functional' },
    { value: 'fair', label: 'Fair — Visible wear, works as expected' },
    { value: 'poor', label: 'Poor — Heavy wear, may have issues' },
];

export default function SellPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect to auth if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Fetch real category IDs from Supabase on mount
    const [categories, setCategories] = useState(CATEGORIES);
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('name');
            if (data && data.length > 0) {
                setCategories([
                    { id: '', name: 'Select a category', icon: '' },
                    ...data.map((c: any) => ({ id: c.id, name: c.name, icon: c.icon || '' })),
                ]);
            }
        };
        fetchCategories();
    }, []);

    const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }

        const newImages = [...images, ...files].slice(0, 5);
        setImages(newImages);

        // Generate previews
        const previews = newImages.map((file) => URL.createObjectURL(file));
        setImagePreviews(previews);
        setError('');
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = [];
        const bucket = 'product-images';

        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            console.log(`[Upload] File ${i + 1}/${images.length}:`, {
                name: file.name,
                size: file.size,
                type: file.type,
                isFile: file instanceof File,
            });

            if (!file || !(file instanceof File)) {
                throw new Error(`Invalid file at index ${i} — the image picker didn't pass a real File object`);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error(`[Upload] FAILED for file ${i + 1}:`, uploadError);
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            console.log(`[Upload] SUCCESS file ${i + 1} → ${publicUrl}`);
            urls.push(publicUrl);
        }

        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // ── Debug: log all form state ──
        console.log('[Sell] ── Submit triggered ──');
        console.log('[Sell] Title:', JSON.stringify(title));
        console.log('[Sell] Price:', JSON.stringify(price));
        console.log('[Sell] CategoryId:', JSON.stringify(categoryId));
        console.log('[Sell] Condition:', JSON.stringify(condition));
        console.log('[Sell] Description length:', description.length);
        console.log('[Sell] Images count:', images.length, images.map(f => f?.name));

        // Validation
        if (!title.trim()) return setError('Title is required');
        if (!price || parseFloat(price) < 0) return setError('Enter a valid price');
        if (!categoryId) return setError('Select a category');
        if (!condition) return setError('Select a condition');

        setLoading(true);

        try {
            // ── Session health-check: refresh before any Supabase call ──
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('[Sell] Session check:', {
                hasSession: !!session,
                userId: session?.user?.id,
                expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none',
                error: sessionError?.message,
            });

            if (!session) {
                setError('Your session has expired. Please sign in again.');
                setLoading(false);
                router.push('/auth');
                return;
            }

            // Try to refresh if token looks stale (within 5 min of expiry or already past)
            const nowSec = Math.floor(Date.now() / 1000);
            if (session.expires_at && session.expires_at - nowSec < 300) {
                console.log('[Sell] Token expiring soon — forcing refresh…');
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                    console.error('[Sell] Refresh FAILED:', refreshError);
                    setError('Session refresh failed. Please sign in again.');
                    setLoading(false);
                    router.push('/auth');
                    return;
                }
                console.log('[Sell] Token refreshed ✓');
            }

            // Upload images FIRST
            let imageUrls: string[] = [];
            if (images.length > 0) {
                try {
                    imageUrls = await uploadImages();
                    console.log('[Sell] All images uploaded:', imageUrls);
                } catch (uploadErr: any) {
                    console.error('[Sell] Aborting — upload failure:', uploadErr);
                    setError(uploadErr.message || 'Image upload failed');
                    alert('Image upload failed. Please check your connection or file type.');
                    setLoading(false);
                    return;
                }
            }

            // Create listing via backend API
            const payload = {
                title: title.trim(),
                description: description.trim(),
                price: parseFloat(price),
                category_id: categoryId,
                condition,
                images: imageUrls,
            };
            console.log('[Sell] API payload:', payload);

            const { data } = await productsApi.create(payload);
            console.log('[Sell] API response:', data);

            if (data.product) {
                router.push('/');
            }
        } catch (err: any) {
            console.error('[Sell] Product creation failed:', err);
            const msg = err.response?.data?.error || err.message || 'Failed to create listing. Please try again.';
            console.error('[Sell] Error details:', {
                status: err.response?.status,
                data: err.response?.data,
                message: msg,
            });
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            {/* Background accents */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)' }} />
                <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
            </div>

            {/* Header */}
            <div className="relative z-10 mb-8 animate-fade-in">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-4 text-sm transition-colors hover:text-white"
                    style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--gradient-primary)' }}>
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Create New Listing
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Sell your items to fellow campus students
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6 animate-slide-up">
                {/* Image Upload */}
                <div className="glass-heavy rounded-2xl p-6">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Product Images <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(up to 5)</span>
                    </label>

                    <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((preview, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden glass group">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}

                        {images.length < 5 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:border-[var(--neon-purple)] hover:bg-white/[0.03]"
                                style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}
                            >
                                <ImagePlus className="w-5 h-5" />
                                <span className="text-[10px]">Add Photo</span>
                            </button>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageAdd}
                        className="hidden"
                    />
                </div>

                {/* Title & Description */}
                <div className="glass-heavy rounded-2xl p-6 space-y-5">
                    <GlassInput
                        label="Title"
                        type="text"
                        placeholder="e.g. Engineering Mathematics — 44th Edition"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        icon={<Tag className="w-4 h-4" />}
                        maxLength={120}
                    />

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Description <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your item — condition details, why you're selling, pickup preferences..."
                            rows={4}
                            maxLength={2000}
                            className="glass-input w-full px-4 py-3 text-sm resize-none rounded-xl"
                        />
                        <p className="text-right text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {description.length}/2000
                        </p>
                    </div>
                </div>

                {/* Price, Category, Condition */}
                <div className="glass-heavy rounded-2xl p-6 space-y-5" style={{ overflow: 'visible' }}>
                    <GlassInput
                        label="Price in INR (₹)"
                        type="number"
                        placeholder="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        icon={<IndianRupee className="w-4 h-4" />}
                        min="0"
                        step="1"
                    />

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Category
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="glass-input w-full px-4 py-3 text-sm rounded-xl appearance-none cursor-pointer"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2371717a\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} style={{ background: '#1c1c21', color: '#e4e4e7' }}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Condition
                        </label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            className="glass-input w-full px-4 py-3 text-sm rounded-xl appearance-none cursor-pointer"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2371717a\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        >
                            {CONDITIONS.map((c) => (
                                <option key={c.value} value={c.value} style={{ background: '#1c1c21', color: '#e4e4e7' }}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-xl text-xs text-red-300 animate-fade-in"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                )}

                {/* Submit */}
                <GlassButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    icon={loading ? undefined : <Upload className="w-5 h-5" />}
                >
                    {loading ? 'Posting...' : 'Post Listing'}
                </GlassButton>

                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Your listing will be visible to all students on campus immediately.
                </p>
            </form>
        </div>
    );
}
