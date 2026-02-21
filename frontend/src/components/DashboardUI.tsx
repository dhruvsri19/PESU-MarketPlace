'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Sparkles, ShoppingBag } from 'lucide-react';

interface DashboardUIProps {
    initialProducts: any[];
    categories: any[];
}

export function DashboardUI({ initialProducts, categories }: DashboardUIProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    const filteredProducts = selectedCategory === 'ALL'
        ? initialProducts
        : initialProducts.filter(p => p.category?.name?.toLowerCase() === selectedCategory.toLowerCase());

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
            {filteredProducts && filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
                    {filteredProducts.map((product, i) => (
                        <ProductCard key={product.id} product={product} index={i} />
                    ))}
                </div>
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
                    <a href="/sell" className="inline-flex h-14 items-center px-8 rounded-2xl bg-white text-black font-black tracking-widest hover:opacity-90 transition-all uppercase text-sm">
                        Post an Ad
                    </a>
                </div>
            )}
        </main>
    );
}
