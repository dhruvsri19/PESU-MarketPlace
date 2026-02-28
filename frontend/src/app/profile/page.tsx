'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadAvatar, deleteAvatar } from '@/lib/avatar';
import { parseCollegeDetails, ParsedCollegeDetails } from '@/utils/college-parser';
import { ProductCard } from '@/components/ProductCard';
import { EditProfileModal } from '@/components/EditProfileModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { LogOut, MapPin, BookOpen, Hash, Package, Camera, Trash2, X, Pencil } from 'lucide-react';

/* ── Skeleton Components ── */
function ProfileHeaderSkeleton() {
    return (
        <div className="glass-heavy rounded-3xl p-6 sm:p-10 mb-12 relative overflow-visible animate-pulse">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-800/60" />
                <div className="flex-1 space-y-4">
                    <div className="h-8 bg-zinc-800/60 rounded-lg w-48" />
                    <div className="h-4 bg-zinc-800/60 rounded w-32" />
                    <div className="flex gap-3">
                        <div className="h-7 bg-zinc-800/60 rounded-full w-36" />
                        <div className="h-7 bg-zinc-800/60 rounded-full w-24" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListingsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card overflow-hidden border border-zinc-800 bg-zinc-900/50 animate-pulse">
                    <div className="aspect-[4/3] bg-zinc-800/60" />
                    <div className="p-5 space-y-3">
                        <div className="h-4 bg-zinc-800/60 rounded-lg w-3/4" />
                        <div className="h-6 bg-zinc-800/60 rounded-lg w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ProfilePage() {
    const { user, profile: contextProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [parsedDetails, setParsedDetails] = useState<ParsedCollegeDetails | null>(null);
    const [myProducts, setMyProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            if (!user) return;

            try {
                // Always fetch fresh from DB to ensure PESU profile data is available
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileData) {
                    console.log('[ProfilePage] Fetched profile:', profileData);
                    setProfile(profileData);
                    setAvatarUrl(profileData.avatar_url || null);
                    // Parse the full name string if available and campus/branch are missing
                    if (profileData.full_name && (!profileData.campus || !profileData.branch)) {
                        const parsed = parseCollegeDetails(profileData.full_name);
                        setParsedDetails(parsed);
                    }
                }

                // Fetch User's Products
                const { data: productsData } = await supabase
                    .from('products')
                    .select(`
                        *,
                        seller:profiles!seller_id(id, full_name, avatar_url),
                        category:categories!category_id(id, name, slug, icon)
                    `)
                    .eq('seller_id', user.id)
                    .neq('status', 'deleted')
                    .order('created_at', { ascending: false });

                if (productsData) {
                    setMyProducts(productsData);
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, authLoading, router, contextProfile]);

    // Auto-open edit modal for first-time users who need to complete their profile
    const needsOnboarding = !profile?.full_name || !profile?.campus;
    useEffect(() => {
        if (!loading && !authLoading && user && needsOnboarding) {
            console.log('[Profile] New user detected — profile:', profile, '— forcing edit modal open');
            setShowEditModal(true);
        }
    }, [loading, authLoading, user, profile, needsOnboarding]);

    // Callback for EditProfileModal — refetch profile after save
    const refreshProfile = async () => {
        if (!user) return;
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileData) {
            setProfile(profileData);
            setAvatarUrl(profileData.avatar_url || null);
            if (profileData.full_name && (!profileData.campus || !profileData.branch)) {
                setParsedDetails(parseCollegeDetails(profileData.full_name));
            } else {
                setParsedDetails(null);
            }
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            console.error('Please select an image file.');
            return;
        }

        // Validate file size (5 MB max)
        if (file.size > 5 * 1024 * 1024) {
            console.error('Image must be under 5 MB.');
            return;
        }

        setAvatarUploading(true);
        try {
            const newUrl = await uploadAvatar(user.id, file);
            setAvatarUrl(newUrl);
        } catch (err) {
            console.error('Avatar upload failed:', err);
        } finally {
            setAvatarUploading(false);
            // Reset input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user) return;
        setShowRemoveModal(false);
        setAvatarUploading(true);
        try {
            await deleteAvatar(user.id);
            setAvatarUrl(null);
        } catch (err) {
            console.error('Avatar removal failed:', err);
        } finally {
            setAvatarUploading(false);
        }
    };

    // Show skeleton while loading
    if (authLoading || loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProfileHeaderSkeleton />
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg glass">
                        <Package className="w-5 h-5 text-[var(--neon-green)]" />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        My Active Listings
                    </h2>
                </div>
                <ListingsSkeleton />
            </div>
        );
    }

    if (!user) return null;

    // Determine display values
    // Prefer explicit DB columns -> then parsed values -> then fallbacks

    const displayName = profile?.full_name || parsedDetails?.name || 'Student';
    // Campus logic
    let displayCampus = profile?.campus || parsedDetails?.campus;
    if (displayCampus === 'EC') displayCampus = 'ECC'; // Normalize if needed
    const campusFull = displayCampus === 'ECC' ? 'Electronic City Campus'
        : displayCampus === 'RR' ? 'Ring Road Campus'
            : displayCampus || 'Unknown Campus';

    const displayBranch = profile?.branch || parsedDetails?.branch || 'Unknown Branch';

    const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Profile Header Card */}
            <div className="glass-heavy rounded-3xl p-6 sm:p-10 mb-12 relative overflow-visible">
                {/* Background decorative glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--neon-purple)] opacity-10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-10">
                    {/* Avatar with upload */}
                    <div className="shrink-0">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <div
                            className="avatar-container w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-[rgba(255,255,255,0.1)] shadow-2xl"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}
                            onClick={() => !avatarUploading && fileInputRef.current?.click()}
                        >
                            {/* Avatar image or initials */}
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={displayName}
                                    fill
                                    sizes="128px"
                                    className="rounded-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                initials
                            )}

                            {/* Upload spinner overlay */}
                            {avatarUploading && (
                                <div className="avatar-overlay active">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Camera hover overlay */}
                            {!avatarUploading && (
                                <div className="avatar-overlay">
                                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            )}
                        </div>
                        {/* Remove avatar button */}
                        {avatarUrl && !avatarUploading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowRemoveModal(true); }}
                                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-200 group/remove"
                                title="Remove profile picture"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover/remove:text-red-400 transition-colors" />
                            </button>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
                                {displayName}
                            </h1>
                            {/* Bio */}
                            {profile?.bio && (
                                <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    {profile.bio}
                                </p>
                            )}
                        </div>

                        {/* Campus & Branch badges */}
                        <div className="flex flex-wrap gap-3">
                            <div className="px-3 py-1 rounded-full glass flex items-center gap-2 text-xs font-semibold tracking-wide"
                                style={{ borderColor: 'var(--neon-blue)', background: 'rgba(59, 130, 246, 0.1)' }}>
                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-blue-200">
                                    {campusFull}
                                </span>
                            </div>

                            <div className="px-3 py-1 rounded-full glass flex items-center gap-2 text-xs font-semibold tracking-wide"
                                style={{ borderColor: 'var(--neon-purple)', background: 'rgba(168, 85, 247, 0.1)' }}>
                                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-purple-200">
                                    {displayBranch}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                            <button
                                onClick={() => {
                                    console.log('[Profile] Edit Profile button clicked');
                                    setShowEditModal(true);
                                }}
                                className="text-xs font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
                                style={{ color: 'var(--neon-blue)' }}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit Profile
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Listings Section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg glass">
                        <Package className="w-5 h-5 text-[var(--neon-green)]" />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        My Active Listings
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium glass" style={{ color: 'var(--text-secondary)' }}>
                        {myProducts.length}
                    </span>
                </div>

                {myProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
                        {myProducts.map((product, i) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={i}
                                onDelete={() => setMyProducts(prev => prev.filter(p => p.id !== product.id))}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card rounded-2xl p-12 text-center border-dashed border-2"
                        style={{ borderColor: 'var(--glass-border)' }}>
                        <p className="text-5xl mb-4 opacity-50">📤</p>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            No active listings
                        </h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                            You haven&apos;t listed anything for sale yet.
                        </p>
                        <GlassButton
                            variant="primary"
                            onClick={() => router.push('/sell')}
                        >
                            Create New Listing
                        </GlassButton>
                    </div>
                )}
            </div>

            {/* Remove Avatar Confirmation Modal */}
            {showRemoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowRemoveModal(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <div className="glass-heavy rounded-2xl p-6 w-full max-w-sm relative z-10 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShowRemoveModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">Remove Profile Picture</h3>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Are you sure you want to remove your profile picture? It will revert to your initials.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                className="flex-1 btn-glass py-2.5 text-sm rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveAvatar}
                                className="flex-1 py-2.5 text-sm rounded-xl font-medium text-white transition-all hover:brightness-110"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditModal && user && (
                <EditProfileModal
                    user={user}
                    profile={profile || { id: user.id, email: user.email }}
                    isFirstTime={needsOnboarding}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={refreshProfile}
                />
            )}
        </div>
    );
}
