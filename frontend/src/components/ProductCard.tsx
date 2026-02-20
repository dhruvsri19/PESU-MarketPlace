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
            className={`glass-card group block overflow-hidden relative border border-zinc-800 bg-zinc-900/50 backdrop-blur-md transition-all duration-300 hover:border-zinc-600 hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] ${isDeleting ? 'pointer-events-none opacity-50' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}>

            {/* Deleting overlay */}
            {isDeleting && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-red-400 rounded-full animate-spin" />
                        <span className="text-xs font-medium text-red-300">Deleting…</span>
                    </div>
                </div>
            )}

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900">
                        <span className="text-4xl opacity-20">📦</span>
                    </div>
                )}

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
                                className="p-2 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-md hover:bg-zinc-800/80 transition-all text-zinc-400 hover:text-white"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-md hover:bg-red-500/20 transition-all text-zinc-400 hover:text-red-400 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleWishlistToggle}
                            disabled={wishlistLoading}
                            className={`p-2 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-md transition-all duration-300 hover:scale-110 ${isWishlisted ? 'text-pink-500 border-pink-500/30' : 'text-zinc-400'}`}>
                            <Heart
                                className={`w-4 h-4 transition-transform duration-300 ${isWishlisted ? 'scale-110 fill-pink-500' : ''}`}
                            />
                        </button>
                    )}
                </div>

                {/* Condition badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-zinc-950/80 border border-zinc-800 backdrop-blur-md"
                    style={{ color: cond.color }}>
                    {cond.label}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base text-zinc-100 truncate flex-1 tracking-tight">
                        {product.title}
                    </h3>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-black text-white tracking-tighter">
                        ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                        {timeAgo(product.created_at)}
                    </span>
                </div>

                {/* Seller & Category Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    {product.seller && (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-300 overflow-hidden">
                                {product.seller.avatar_url ? (
                                    <img src={product.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    product.seller.full_name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                            <span className="text-[11px] font-medium text-zinc-400">
                                {product.seller.full_name?.split(' ')[0] || 'Peer'}
                            </span>
                        </div>
                    )}
                    {product.category && (
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                            {product.category.name}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );

}
