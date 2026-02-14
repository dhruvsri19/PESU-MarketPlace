'use client';

import Link from 'next/link';
import { Heart, Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { productsApi, wishlistApi } from '@/lib/api';

interface ProductCardProps {
    product: {
        id: string;
        title: string;
        price: number;
        images: string[];
        condition: string;
        created_at: string;
        views_count: number;
        seller?: {
            id: string;
            full_name: string;
            avatar_url: string;
        };
        category?: {
            name: string;
            icon: string;
        };
        seller_id?: string;
    };
    index?: number;
    onDelete?: () => void;
    initialWishlisted?: boolean;
    onWishlistChange?: (productId: string, wishlisted: boolean) => void;
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

const conditionLabels: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: '#10b981' },
    like_new: { label: 'Like New', color: '#06b6d4' },
    good: { label: 'Good', color: '#3b82f6' },
    fair: { label: 'Fair', color: '#f59e0b' },
    poor: { label: 'Poor', color: '#ef4444' },
};

export function ProductCard({ product, index = 0, onDelete, initialWishlisted = false, onWishlistChange }: ProductCardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const cond = conditionLabels[product.condition] || conditionLabels.good;

    // Sync if parent changes the initial value
    useEffect(() => {
        setIsWishlisted(initialWishlisted);
    }, [initialWishlisted]);

    // Check if current user is the owner
    const isOwner = user && (user.id === product.seller_id || (product.seller && user.id === product.seller.id));

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            router.push('/login');
            return;
        }

        if (wishlistLoading) return;

        // Optimistic UI — flip state instantly
        const newState = !isWishlisted;
        setIsWishlisted(newState);
        setWishlistLoading(true);

        try {
            const { data } = await wishlistApi.toggle(product.id);
            // Server confirms actual state
            setIsWishlisted(data.wishlisted);
            onWishlistChange?.(product.id, data.wishlisted);
        } catch (err) {
            console.error('Wishlist toggle failed:', err);
            // Revert on failure
            setIsWishlisted(!newState);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await productsApi.delete(product.id);

            if (product.images && product.images.length > 0) {
                const paths = product.images.map(url => {
                    const parts = url.split('/product-images/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(p => p !== null) as string[];

                if (paths.length > 0) {
                    supabase.storage.from('product-images').remove(paths).catch(() => { });
                }
            }

            if (onDelete) {
                onDelete();
            }
        } catch (err) {
            console.error('Failed to delete product:', err);
            alert('Failed to delete product. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <Link href={`/product/${product.id}`}
            className={`glass-card group block overflow-hidden relative transition-opacity duration-300 ${isDeleting ? 'pointer-events-none opacity-50' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}>

            {/* Deleting overlay */}
            {isDeleting && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-red-400 rounded-full animate-spin" />
                        <span className="text-xs font-medium text-red-300">Deleting…</span>
                    </div>
                </div>
            )}

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.02]">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}>
                        <span className="text-4xl">📦</span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Actions: Wishlist OR Edit/Delete */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                    {isOwner ? (
                        <>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/edit/${product.id}`);
                                }}
                                className="p-2 rounded-full glass hover:bg-white/10 transition-all text-blue-400 hover:text-blue-300"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 rounded-full glass hover:bg-red-500/20 transition-all text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleWishlistToggle}
                            disabled={wishlistLoading}
                            className={`p-2 rounded-full glass transition-all duration-200 hover:scale-110 ${isWishlisted ? 'bg-pink-500/20' : ''}`}
                            style={{
                                color: isWishlisted ? '#ec4899' : 'var(--text-secondary)',
                            }}>
                            <Heart
                                className={`w-4 h-4 transition-transform duration-200 ${isWishlisted ? 'scale-110' : ''}`}
                                fill={isWishlisted ? '#ec4899' : 'none'}
                            />
                        </button>
                    )}
                </div>

                {/* Condition badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider glass"
                    style={{ color: cond.color, borderColor: `${cond.color}40` }}>
                    {cond.label}
                </div>

                {/* Category */}
                {product.category && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-medium glass"
                        style={{ color: 'var(--text-secondary)' }}>
                        {product.category.icon} {product.category.name}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-sm truncate mb-1"
                    style={{ color: 'var(--text-primary)' }}>
                    {product.title}
                </h3>

                <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold neon-text">
                        ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(product.created_at)}
                    </span>
                </div>

                {/* Seller */}
                {product.seller && (
                    <div className="flex items-center gap-2 pt-3"
                        style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                            {product.seller.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {product.seller.full_name || 'Anonymous'}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}
