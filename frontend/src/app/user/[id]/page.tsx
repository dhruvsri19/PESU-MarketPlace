'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { MapPin, BookOpen, Package } from 'lucide-react';

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const [profile, setProfile] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                const [profileRes, productsRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, bio, campus, branch')
                        .eq('id', userId)
                        .single(),
                    supabase
                        .from('products')
                        .select(`
                            *,
                            seller:profiles!seller_id(id, full_name, avatar_url),
                            category:categories!category_id(id, name, slug, icon)
                        `)
                        .eq('seller_id', userId)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false }),
                ]);

                if (profileRes.data) setProfile(profileRes.data);
                if (productsRes.data) setProducts(productsRes.data);
            } catch (err) {
                console.error('Failed to load public profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-zinc-500 text-sm">User not found</p>
            </div>
        );
    }

    const initials = (profile.full_name || '?')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const campusFull =
        profile.campus === 'ECC' ? 'Electronic City Campus'
            : profile.campus === 'RR' ? 'Ring Road Campus'
                : profile.campus || null;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Profile Header */}
            <div className="glass-heavy rounded-3xl p-6 sm:p-10 mb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--neon-purple)] opacity-10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar */}
                    <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden relative shrink-0"
                        style={{ background: 'var(--gradient-primary)', color: 'white' }}
                    >
                        {profile.avatar_url ? (
                            <Image
                                src={profile.avatar_url}
                                alt={profile.full_name || ''}
                                fill
                                sizes="112px"
                                className="rounded-full object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left space-y-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            {profile.full_name || 'Student'}
                        </h1>

                        {profile.bio && (
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            {campusFull && (
                                <div className="px-3 py-1 rounded-full glass flex items-center gap-2 text-xs font-semibold tracking-wide"
                                    style={{ borderColor: 'var(--neon-blue)', background: 'rgba(59, 130, 246, 0.1)' }}>
                                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-blue-200">{campusFull}</span>
                                </div>
                            )}
                            {profile.branch && (
                                <div className="px-3 py-1 rounded-full glass flex items-center gap-2 text-xs font-semibold tracking-wide"
                                    style={{ borderColor: 'var(--neon-purple)', background: 'rgba(168, 85, 247, 0.1)' }}>
                                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-purple-200">{profile.branch}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Listings */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg glass">
                    <Package className="w-5 h-5 text-[var(--neon-green)]" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Active Listings
                </h2>
                <span className="ml-auto px-2.5 py-0.5 rounded-full glass text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    {products.length}
                </span>
            </div>

            {products.length === 0 ? (
                <div className="glass-heavy rounded-2xl p-12 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        No active listings yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, i) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            index={i}
                            onDelete={() => setProducts(prev => prev.filter(p => p.id !== product.id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
