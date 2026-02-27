'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Sparkles, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 12;

interface DashboardUIProps {
    initialProducts: any[];
    categories: any[];
}

/* ── Skeleton Card ── */
function ProductSkeleton() {
    return (
        <div className="glass-card overflow-hidden border border-zinc-800 bg-zinc-900/50 animate-pulse">
            <div className="aspect-[4/3] bg-zinc-800/60" />
            <div className="p-5 space-y-3">
                <div className="h-4 bg-zinc-800/60 rounded-lg w-3/4" />
                <div className="h-6 bg-zinc-800/60 rounded-lg w-1/3" />
                <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-zinc-800/60 rounded-full" />
                        <div className="h-3 bg-zinc-800/60 rounded w-16" />
                    </div>
                    <div className="h-3 bg-zinc-800/60 rounded w-12" />
                </div>
            </div>
        </div>
    );
}

export function DashboardUI({ initialProducts, categories }: DashboardUIProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Mark initial load complete after first render
    useEffect(() => {
        setInitialLoaded(true);
    }, []);

    // Memoize filtered products so we only recompute when inputs change
    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'ALL') return initialProducts;
        return initialProducts.filter(
            p => p.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
        );
    }, [initialProducts, selectedCategory]);

    // Reset visible count when category changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [selectedCategory]);

    // Slice for current page
    const visibleProducts = useMemo(
        () => filteredProducts.slice(0, visibleCount),
        [filteredProducts, visibleCount]
    );
    const hasMore = visibleCount < filteredProducts.length;

    // Load more callback
    const loadMore = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length));
    }, [filteredProducts.length]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Hero / Header */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-xl shadow-white/5">
                        <ShoppingBag className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">THE MARKETPLACE</h1>
                        <p className="text-zinc-500 font-medium">Curated items from your peers at PES University.</p>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mt-8">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase ${selectedCategory === 'ALL'
                            ? 'bg-white text-black hover:opacity-90'
                            : 'border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        ALL ITEMS
                    </button>

                    {categories?.map((cat: any) => {
                        const isSelected = selectedCategory === cat.name.toUpperCase();
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name.toUpperCase())}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase ${isSelected
                                    ? 'bg-white text-black hover:opacity-90'
                                    : 'border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
                                    }`}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Products Grid */}
            {!initialLoaded ? (
                /* Skeleton loading grid on initial render */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
                        {visibleProducts.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} />
                        ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    {hasMore && (
                        <div ref={sentinelRef} className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-white/10 border-t-[var(--neon-purple)] rounded-full animate-spin" />
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card p-20 text-center border-dashed border-2 border-zinc-800 bg-transparent rounded-[2.5rem]">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-zinc-900 border border-zinc-800">
                        <Sparkles className="w-10 h-10 text-zinc-600" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">MARKET IS EMPTY</h3>
                    <p className="text-zinc-500 max-w-md mx-auto mb-8 font-medium">
                        {selectedCategory === 'ALL'
                            ? 'Be the first one to list an item and start the trade!'
                            : `No items found in ${selectedCategory}.`
                        }
                    </p>
                    <Link href="/sell" className="inline-flex h-14 items-center px-8 rounded-2xl bg-white text-black font-black tracking-widest hover:opacity-90 transition-all uppercase text-sm">
                        Post an Ad
                    </Link>
                </div>
            )}
        </main>
    );
}
