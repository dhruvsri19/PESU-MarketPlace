'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { wishlistApi } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { Heart, Sparkles } from 'lucide-react';

export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        async function fetchWishlist() {
            try {
                const { data } = await wishlistApi.getAll();
                // Each item has a nested `product` object
                const items = (data.wishlist || [])
                    .filter((item: any) => item.product && item.product.status !== 'deleted')
                    .map((item: any) => item.product);
                setProducts(items);
            } catch (err) {
                console.error('Failed to fetch wishlist:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchWishlist();
    }, [user, authLoading, router]);

    // When a card is un-wishlisted, remove it from the list optimistically
    const handleWishlistChange = (productId: string, wishlisted: boolean) => {
        if (!wishlisted) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-pink-500 rounded-full animate-spin" />
                    <p style={{ color: 'var(--text-muted)' }}>Loading your wishlist…</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                        <Heart className="w-5 h-5 text-white" fill="white" />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Saved Items
                    </h1>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {products.length > 0
                        ? `You have ${products.length} item${products.length !== 1 ? 's' : ''} saved for later`
                        : 'Items you save will appear here'}
                </p>
            </div>

            {/* Products grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
                    {products.map((product, i) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            index={i}
                            initialWishlisted={true}
                            onWishlistChange={handleWishlistChange}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-card p-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(244,63,94,0.1))' }}>
                        <Sparkles className="w-10 h-10 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No saved items yet
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Tap the heart icon on any product to save it for later.
                        Your saved items will appear here.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-primary inline-flex items-center gap-2 text-sm"
                    >
                        Browse Products
                    </button>
                </div>
            )}
        </main>
    );
}
