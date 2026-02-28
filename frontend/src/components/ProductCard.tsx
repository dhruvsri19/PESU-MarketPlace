'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, Edit } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { wishlistApi } from '@/lib/api';

interface ProductCardProps {
    product: {
        id: string;
        title: string;
        price: number;
        images: string[];
        condition: string;
        created_at: string;
        views_count: number;
        seller?: { id: string; full_name: string; avatar_url: string; };
        category?: { name: string; icon: string; };
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

const condBadge: Record<string, { label: string; bg: string; color: string }> = {
    new: { label: 'New', bg: 'rgba(255,107,43,0.15)', color: '#ff6b2b' },
    like_new: { label: 'Like New', bg: '#ff6b2b', color: '#fff' },
    good: { label: 'Good', bg: 'rgba(255,255,255,0.08)', color: '#aaa' },
    fair: { label: 'Fair', bg: 'rgba(255,255,255,0.06)', color: '#888' },
    poor: { label: 'Poor', bg: 'rgba(255,255,255,0.05)', color: '#666' },
};

function ProductCardInner({ product, index = 0, onDelete, initialWishlisted = false, onWishlistChange }: ProductCardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => { setIsWishlisted(initialWishlisted); }, [initialWishlisted]);

    const isOwner = user && (
        user.id === product.seller_id ||
        (product.seller && user.id === product.seller.id)
    );

    const cond = condBadge[product.condition] || condBadge.good;

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const { data: { user: freshUser }, error } = await supabase.auth.getUser();
        if (error || !freshUser) { alert('Please log in first'); router.push('/login'); return; }
        if (wishlistLoading) return;
        const newState = !isWishlisted;
        setIsWishlisted(newState);
        setWishlistLoading(true);
        try {
            const { data } = await wishlistApi.toggle(product.id);
            setIsWishlisted(data.wishlisted);
            onWishlistChange?.(product.id, data.wishlisted);
        } catch {
            setIsWishlisted(!newState);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Delete this listing?')) return;
        setIsDeleting(true);
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw new Error('Not authenticated');
            if (product.images?.length) {
                const paths = product.images.map(url => {
                    const parts = url.split('/product-images/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter((p): p is string => p !== null);
                if (paths.length) await supabase.storage.from('product-images').remove(paths).catch(() => { });
            }
            const { error: delErr } = await supabase.from('products').delete().eq('id', product.id).eq('seller_id', user.id);
            if (delErr) throw delErr;
            onDelete?.();
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            style={{ opacity: isDeleting ? 0.4 : 1, pointerEvents: isDeleting ? 'none' : 'auto' }}
        >
            <Link
                href={`/product/${product.id}`}
                style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}
            >
                <motion.div
                    onHoverStart={() => setHovered(true)}
                    onHoverEnd={() => setHovered(false)}
                    whileHover={{ y: -4 }}
                    style={{
                        background: '#242424',
                        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'border-color 200ms ease',
                    }}
                >
                    {/* Image */}
                    <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                        {product.images?.[0]?.startsWith('http') ? (
                            <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                sizes="(max-width:768px) 50vw, 25vw"
                                style={{
                                    objectFit: 'cover',
                                    transform: hovered ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'transform 380ms ease',
                                }}
                                loading="lazy"
                            />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#2a2a2a', fontSize: '3rem',
                            }}>
                                📦
                            </div>
                        )}

                        {/* Overlay top gradient */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.4) 100%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Owner actions */}
                        {isOwner && (
                            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/edit/${product.id}`); }}
                                    style={{
                                        width: '30px', height: '30px', borderRadius: '50%',
                                        background: 'rgba(20,20,20,0.85)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#ccc',
                                    }}
                                >
                                    <Edit style={{ width: '12px', height: '12px' }} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={handleDelete}
                                    style={{
                                        width: '30px', height: '30px', borderRadius: '50%',
                                        background: 'rgba(20,20,20,0.85)',
                                        border: '1px solid rgba(255,60,60,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#ff4d4d',
                                    }}
                                >
                                    <Trash2 style={{ width: '12px', height: '12px' }} />
                                </motion.button>
                            </div>
                        )}

                        {/* Condition badge bottom left */}
                        <div style={{
                            position: 'absolute', bottom: '10px', left: '10px',
                            background: cond.bg,
                            borderRadius: '999px',
                            padding: '4px 10px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            fontFamily: "'Syne', sans-serif",
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: cond.color,
                        }}>
                            {cond.label}
                        </div>

                        {/* Wishlist / + button bottom right */}
                        {!isOwner && (
                            <motion.button
                                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                                onClick={handleWishlistToggle}
                                style={{
                                    position: 'absolute', bottom: '10px', right: '10px',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: isWishlisted ? '#ff6b2b' : 'rgba(26,26,26,0.85)',
                                    border: `1.5px solid ${isWishlisted ? '#ff6b2b' : 'rgba(255,255,255,0.15)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'background 150ms ease, border-color 150ms ease',
                                }}
                            >
                                <Heart
                                    style={{ width: '14px', height: '14px', color: isWishlisted ? '#fff' : '#aaa' }}
                                    fill={isWishlisted ? '#fff' : 'none'}
                                />
                            </motion.button>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '14px 14px 16px' }}>
                        {/* Price */}
                        <div style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: '#ff6b2b',
                            marginBottom: '6px',
                            letterSpacing: '-0.01em',
                        }}>
                            ₹{product.price.toLocaleString()}
                        </div>

                        {/* Title */}
                        <h3 style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            margin: '0 0 8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {product.title}
                        </h3>

                        {/* Seller + time */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span
                                style={{ fontSize: '0.72rem', color: '#555', fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}
                                onClick={e => { e.preventDefault(); e.stopPropagation(); if (product.seller?.id) router.push(`/user/${product.seller.id}`); }}
                            >
                                {product.seller?.full_name?.split(' ')[0] || 'Peer'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#444', fontFamily: "'Inter', sans-serif" }}>
                                {timeAgo(product.created_at)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    );
}

export const ProductCard = memo(ProductCardInner);
