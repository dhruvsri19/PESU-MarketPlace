'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { supabase } from '@/lib/supabase';
import { wishlistApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Clock, ChevronDown, Sparkles } from 'lucide-react';

type SortOption = 'newest' | 'trending' | 'price_low' | 'price_high';

export default function HomePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('newest');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  const sortLabels: Record<SortOption, { label: string; icon: typeof Clock }> = {
    newest: { label: 'Newest', icon: Clock },
    trending: { label: 'Trending', icon: TrendingUp },
    price_low: { label: 'Price: Low → High', icon: ChevronDown },
    price_high: { label: 'Price: High → Low', icon: ChevronDown },
  };

  // Fetch categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch products from Supabase directly
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:profiles!seller_id(id, full_name, avatar_url),
          category:categories!category_id(id, name, slug, icon)
        `)
        .eq('status', 'active');

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      switch (sort) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'trending':
          query = query.order('views_count', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) {
        console.error('Fetch products error:', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Fetch products exception:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load wishlisted IDs for the current user
  useEffect(() => {
    if (!user) {
      setWishlistedIds(new Set());
      return;
    }
    async function loadWishlist() {
      try {
        const { data } = await wishlistApi.getAll();
        const ids = new Set<string>(
          (data.wishlist || []).map((item: any) => item.product_id || item.product?.id).filter(Boolean)
        );
        setWishlistedIds(ids);
      } catch (err) {
        console.error('Failed to load wishlist IDs:', err);
      }
    }
    loadWishlist();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4 text-xs font-medium"
          style={{ color: 'var(--text-accent)' }}>
          <Sparkles className="w-3.5 h-3.5" />
          Campus-only marketplace
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
          <span className="neon-text">Buy & Sell</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>Within Your Campus</span>
        </h1>
        <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
          From textbooks to electronics — find deals from fellow students, or list your own items in seconds.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in"
        style={{ animationDelay: '0.2s' }}>
        <CategoryFilter
          categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug || c.name.toLowerCase(), icon: c.icon || '' }))}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="btn-glass flex items-center gap-2 text-xs whitespace-nowrap"
          >
            {(() => {
              const SortIcon = sortLabels[sort].icon;
              return <SortIcon className="w-3.5 h-3.5" />;
            })()}
            {sortLabels[sort].label}
            <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 top-full mt-2 rounded-xl p-1 min-w-[180px] z-[9999] animate-fade-in" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'var(--shadow-card)' }}>
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setSort(key); setShowSortMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${sort === key ? 'text-white' : ''
                    }`}
                  style={sort === key
                    ? { background: 'var(--gradient-primary)' }
                    : { color: 'var(--text-secondary)' }
                  }
                  onMouseEnter={(e) => {
                    if (sort !== key) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (sort !== key) (e.target as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {(() => {
                    const Icon = sortLabels[key].icon;
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {sortLabels[key].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {products.length} item{products.length !== 1 ? 's' : ''} found
          {search && <span> for &quot;{search}&quot;</span>}
        </p>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <div className="skeleton aspect-[4/3]" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-6 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              initialWishlisted={wishlistedIds.has(product.id)}
              onDelete={() => setProducts(prev => prev.filter(p => p.id !== product.id))}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No items found
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {search || selectedCategory
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'No items listed yet. Be the first to sell something!'}
          </p>
          {(search || selectedCategory) && (
            <GlassButton
              variant="glass"
              size="sm"
              onClick={() => { setSearch(''); setSelectedCategory(null); }}
              className="mt-4"
            >
              Clear Filters
            </GlassButton>
          )}
        </div>
      )}
    </div>
  );
}
