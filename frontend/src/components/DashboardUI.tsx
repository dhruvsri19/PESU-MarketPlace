'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ProductCard';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 12;

interface DashboardUIProps {
    initialProducts: any[];
    categories: any[];
}

function ProductSkeleton() {
    return (
        <div style={{ background: '#242424', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ aspectRatio: '4/3', background: '#2a2a2a' }} className="skeleton" />
            <div style={{ padding: '14px' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '8px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '13px', width: '75%', marginBottom: '8px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '11px', width: '55%', borderRadius: '4px' }} />
            </div>
        </div>
    );
}

export function DashboardUI({ initialProducts, categories }: DashboardUIProps) {
    const { user } = useAuth();
    const [products, setProducts] = useState<any[]>(initialProducts);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setProducts(initialProducts); }, [initialProducts]);
    useEffect(() => { setInitialLoaded(true); }, []);

    const filteredProducts = useMemo(() => {
        let list = products;
        if (selectedCategory !== 'ALL') {
            list = list.filter(p => p.category?.name?.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [products, selectedCategory, searchQuery]);

    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, searchQuery]);

    const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
    const hasMore = visibleCount < filteredProducts.length;

    const loadMore = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length));
    }, [filteredProducts.length]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore(); },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const allTabs = [
        { key: 'ALL', label: 'All Items' },
        ...categories.map(c => ({ key: c.name.toUpperCase(), label: `${c.icon ? c.icon + ' ' : ''}${c.name}` })),
    ];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 80px' }}>

            {/* ── Heading ── */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: '24px' }}
            >
                <p style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '0.68rem', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: '#ff6b2b', margin: '0 0 6px',
                }}>
                    PESU Marketplace
                </p>
                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    margin: 0,
                }}>
                    Browse Listings
                </h1>
            </motion.div>

            {/* ── Search bar (between heading and category tabs, full width) ── */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search style={{
                    position: 'absolute', left: '18px', top: '50%',
                    transform: 'translateY(-50%)',
                    width: '17px', height: '17px', color: '#444',
                    pointerEvents: 'none',
                }} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for textbooks, electronics, hostel gear..."
                    style={{
                        width: '100%',
                        padding: '14px 20px 14px 50px',
                        background: '#242424',
                        border: '1.5px solid rgba(255,255,255,0.07)',
                        borderRadius: '999px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        fontFamily: "'Inter', sans-serif",
                        outline: 'none',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={e => {
                        e.currentTarget.style.borderColor = '#ff6b2b';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,43,0.15)';
                    }}
                    onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
            </div>

            {/* ── Category tabs — orange underline style ── */}
            <div style={{
                display: 'flex',
                gap: '0',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                marginBottom: '32px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {allTabs.map(tab => {
                    const active = selectedCategory === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedCategory(tab.key)}
                            style={{
                                padding: '10px 20px',
                                fontFamily: "'Syne', sans-serif",
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: active ? '#fff' : '#555',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                position: 'relative',
                                transition: 'color 140ms ease',
                                paddingBottom: '12px',
                            }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#aaa'; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#555'; }}
                        >
                            {tab.label}
                            {active && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-1px', left: '20px', right: '20px',
                                    height: '2.5px',
                                    background: '#ff6b2b',
                                    borderRadius: '999px',
                                    display: 'block',
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Count ── */}
            <p style={{ color: '#444', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif", marginBottom: '20px', margin: '0 0 20px' }}>
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
                {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>

            {/* ── Grid ── */}
            {
                !initialLoaded ? (
                    <div className="listings-grid">
                        {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <>
                        <div className="listings-grid">
                            {visibleProducts.map((product, i) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    index={i}
                                    onDelete={() => setProducts(prev => prev.filter(p => p.id !== product.id))}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', paddingTop: '52px' }}>
                                <div style={{
                                    width: '20px', height: '20px',
                                    border: '2.5px solid rgba(255,107,43,0.2)',
                                    borderTopColor: '#ff6b2b',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            border: '1.5px dashed rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            padding: '80px 40px',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🛍️</div>
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '8px', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                            {searchQuery ? 'No results found' : 'Nothing here yet'}
                        </h3>
                        <p style={{ color: '#555', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif", marginBottom: '24px' }}>
                            {searchQuery ? `No listings match "${searchQuery}"` : 'Be the first to post!'}
                        </p>
                        <Link href="/sell" style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ scale: 1.03, boxShadow: '0 6px 28px rgba(255,107,43,0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    display: 'inline-block',
                                    background: '#ff6b2b',
                                    color: '#fff',
                                    borderRadius: '999px',
                                    padding: '13px 32px',
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 4px 20px rgba(255,107,43,0.3)',
                                }}
                            >
                                Post a Listing
                            </motion.div>
                        </Link>
                    </motion.div>
                )
            }
        </div >
    );
}
