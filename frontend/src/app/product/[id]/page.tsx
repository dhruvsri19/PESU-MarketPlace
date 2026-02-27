'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { wishlistApi, messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, Heart, MessageCircle, Share2, MapPin,
    Eye, Clock, Tag, ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle
} from 'lucide-react';

const conditionMap: Record<string, { label: string; color: string; desc: string }> = {
    new: { label: 'Brand New', color: '#10b981', desc: 'Unused, in original packaging' },
    like_new: { label: 'Like New', color: '#06b6d4', desc: 'Barely used, no visible wear' },
    good: { label: 'Good', color: '#3b82f6', desc: 'Minor signs of use, fully functional' },
    fair: { label: 'Fair', color: '#f59e0b', desc: 'Visible wear, works as expected' },
    poor: { label: 'Poor', color: '#ef4444', desc: 'Heavy wear, may have issues' },
};

function timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 2592000)} months ago`;
}

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        seller:profiles!seller_id(id, full_name, avatar_url, hostel, created_at),
                        category:categories!category_id(id, name, slug, icon)
                    `)
                    .eq('id', params.id as string)
                    .neq('status', 'deleted')
                    .single();

                if (error || !data) {
                    setNotFound(true);
                } else {
                    setProduct(data);
                }
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        // Check wishlist status
        const checkWishlist = async () => {
            if (!user) return;
            try {
                const { data } = await wishlistApi.check(params.id as string);
                setIsWishlisted(data.wishlisted);
            } catch {
                // ignore
            }
        };

        fetchProduct();
        checkWishlist();
    }, [params.id, user]);

    const handleWishlistToggle = async () => {
        console.log('[Wishlist] Button clicked');
        // Get fresh user at click time
        const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !freshUser) {
            alert('Please log in first');
            router.push('/login');
            return;
        }
        const prev = isWishlisted;
        setIsWishlisted(!prev);
        try {
            await wishlistApi.toggle(product.id);
        } catch (err) {
            console.error('[Wishlist] Toggle failed:', err);
            setIsWishlisted(prev);
            alert('Failed to update wishlist. Please try again.');
        }
    };

    const handleChat = async () => {
        console.log('[Chat] Button clicked');
        // Get fresh user at click time
        const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !freshUser) {
            alert('Please log in first');
            router.push('/login');
            return;
        }
        setChatLoading(true);
        try {
            const { data } = await messagesApi.createConversation(product.id);
            router.push(`/messages?conversation=${data.conversation.id}`);
        } catch (err: any) {
            console.error('[Chat] Create conversation failed:', err);
            const msg = err?.response?.data?.error || err?.message || 'Failed to start chat';
            alert(msg);
        } finally {
            setChatLoading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: product.title,
                text: `Check out "${product.title}" on UniMart — ₹${product.price}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="skeleton aspect-square rounded-2xl" />
                    <div className="space-y-4">
                        <div className="skeleton h-8 w-3/4 rounded-xl" />
                        <div className="skeleton h-10 w-1/3 rounded-xl" />
                        <div className="skeleton h-32 w-full rounded-xl" />
                        <div className="skeleton h-24 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <p className="text-6xl mb-4">😕</p>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Product Not Found
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    This listing may have been removed or doesn&apos;t exist.
                </p>
                <GlassButton variant="primary" onClick={() => router.push('/')}>
                    Back to Home
                </GlassButton>
            </div>
        );
    }

    const cond = conditionMap[product.condition] || conditionMap.good;
    const images: string[] = product.images?.length > 0 ? product.images : [];
    const isSeller = user?.id === product.seller?.id;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 mb-6 text-sm transition-colors hover:text-white"
                style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="w-4 h-4" />
                Back to listings
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Image Gallery */}
                <div className="lg:col-span-3">
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {/* Main image */}
                        <div className="relative aspect-[4/3] bg-white/[0.02]">
                            {images.length > 0 ? (
                                <>
                                    <img
                                        src={images[currentImage]}
                                        alt={product.title}
                                        className="w-full h-full object-contain"
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImage(Math.max(0, currentImage - 1))}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/10 transition-colors"
                                                disabled={currentImage === 0}>
                                                <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                                            </button>
                                            <button
                                                onClick={() => setCurrentImage(Math.min(images.length - 1, currentImage + 1))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/10 transition-colors"
                                                disabled={currentImage === images.length - 1}>
                                                <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                                            </button>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {images.map((_: string, i: number) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentImage(i)}
                                                        className="w-2 h-2 rounded-full transition-all"
                                                        style={{
                                                            background: i === currentImage ? 'var(--neon-purple)' : 'rgba(255,255,255,0.3)',
                                                            transform: i === currentImage ? 'scale(1.3)' : 'scale(1)',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <span className="text-7xl">📦</span>
                                    <span className="text-sm">No images uploaded</span>
                                </div>
                            )}

                            {/* Condition badge */}
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold glass"
                                style={{ color: cond.color }}>
                                {cond.label}
                            </div>
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className="flex gap-2 p-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                                {images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImage(i)}
                                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage ? 'border-[var(--neon-purple)] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Category & views */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <Tag className="w-3.5 h-3.5" />
                            {product.category?.icon} {product.category?.name}
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {product.views_count || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {timeAgo(product.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {product.title}
                    </h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold neon-text">
                            ₹{product.price?.toLocaleString()}
                        </span>
                    </div>

                    {/* Condition detail */}
                    <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ background: cond.color }} />
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Condition: {cond.label}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {cond.desc}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        {!isSeller ? (
                            <GlassButton
                                variant="primary"
                                size="lg"
                                className="flex-1"
                                icon={<MessageCircle className="w-5 h-5" />}
                                onClick={handleChat}
                                loading={chatLoading}
                            >
                                Chat with Seller
                            </GlassButton>
                        ) : (
                            <GlassButton
                                variant="glass"
                                size="lg"
                                className="flex-1"
                                disabled
                            >
                                This is your listing
                            </GlassButton>
                        )}
                        <GlassButton
                            variant="glass"
                            size="lg"
                            onClick={handleWishlistToggle}
                            icon={<Heart className="w-5 h-5" fill={isWishlisted ? '#ec4899' : 'none'} stroke={isWishlisted ? '#ec4899' : 'currentColor'} />}
                        >
                            {''}
                        </GlassButton>
                        <GlassButton
                            variant="glass"
                            size="lg"
                            onClick={handleShare}
                            icon={<Share2 className="w-5 h-5" />}
                        >
                            {''}
                        </GlassButton>
                    </div>

                    {/* Meet in person notice */}
                    <div className="glass rounded-xl p-4 flex items-start gap-3"
                        style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>Meet on campus</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                All transactions happen in person via UPI or cash. Meet at a safe campus location.
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div>
                            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Description
                            </h3>
                            <p className="text-sm leading-relaxed whitespace-pre-line"
                                style={{ color: 'var(--text-secondary)' }}>
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Seller info */}
                    <GlassCard hover={false} className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                                style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                {product.seller?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {product.seller?.full_name || 'Anonymous'}
                                </p>
                                {product.seller?.hostel && (
                                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                        <MapPin className="w-3 h-3" />
                                        {product.seller.hostel}
                                    </p>
                                )}
                                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    <ShieldCheck className="w-3 h-3" style={{ color: 'var(--neon-green)' }} />
                                    Verified student · Joined {timeAgo(product.seller?.created_at || '')}
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
