'use client';

/*
 * ⚠️  If you see "could not find column in schema cache" errors,
 *     run this SQL in Supabase SQL Editor:
 *
 *     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus TEXT;
 *     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
 *     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester INT;
 *     NOTIFY pgrst, 'reload schema';
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { parseCollegeDetails } from '@/utils/college-parser';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles, ArrowRight, CheckCircle, GraduationCap, MapPin, Hash, User, BookOpen } from 'lucide-react';

const CAMPUSES = [
    { id: 'RR', name: 'Ring Road Campus' },
    { id: 'ECC', name: 'Electronic City Campus' },
];

const BRANCHES = [
    'CSE', 'AIML', 'ECE', 'EEE', 'ME', 'BT', 'BBA', 'BCOM', 'BCA', 'Other'
];

export default function OnboardingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [usn, setUsn] = useState('');
    const [phone, setPhone] = useState('');
    const [branch, setBranch] = useState('');
    const [semester, setSemester] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchProfile = async () => {
            if (!user) return;
            try {
                const { data } = await authApi.getProfile();
                if (data?.profile) {
                    const profile = data.profile;
                    setName(profile.full_name || '');
                    setUsn(profile.usn || '');
                    setPhone(profile.phone_number || '');
                    setBranch(profile.branch || '');
                    if (profile.semester) setSemester(profile.semester);
                }
            } catch (err) {
                console.error('Failed to fetch profile for onboarding pre-fill', err);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError('Please enter your full name');
        if (!usn.trim()) return setError('Please enter your USN');
        if (!usn.toUpperCase().startsWith('1PE')) return setError('USN must start with "1PE"');
        if (!phone.trim()) return setError('Please enter your phone number');
        if (phone.length < 10) return setError('Please enter a valid phone number');
        if (!branch) return setError('Please select your branch');

        setLoading(true);

        try {
            await authApi.updateProfile({
                full_name: name.trim(),
                usn: usn.toUpperCase().trim(),
                phone_number: phone.trim(),
                branch,
                semester: semester ? Number(semester) : undefined,
                is_onboarded: true,
            });
            // Redirect to dashboard as requested
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };


    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-visible">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--neon-purple)] opacity-10 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--neon-blue)] opacity-10 blur-[100px] rounded-full" />
            </div>

            <div className="glass-heavy rounded-3xl p-8 sm:p-10 w-full max-w-lg relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'var(--gradient-primary)' }}>
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                        Complete Your Profile
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Help fellow students know who they are buying from.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <GlassInput
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dhruv Srivastava"
                        icon={<User className="w-4 h-4" />}
                    />

                    {/* USN */}
                    <GlassInput
                        label="University Serial Number (USN)"
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                        placeholder="e.g. 1PE21CS001"
                        icon={<Hash className="w-4 h-4" />}
                    />

                    {/* Phone Number */}
                    <GlassInput
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        icon={<MapPin className="w-4 h-4" />} // Using MapPin as a placeholder or could use Phone if imported
                    />


                    {/* Branch */}
                    <div style={{ position: 'relative', zIndex: 9999 }}>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Branch/Department
                        </label>
                        <div className="relative">
                            <select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="glass-input w-full px-4 py-3 pl-10 text-sm rounded-xl appearance-none cursor-pointer"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2371717a\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                <option value="" disabled>Select your branch</option>
                                {BRANCHES.map((b) => (
                                    <option key={b} value={b} style={{ background: '#1c1c21', color: '#e4e4e7' }}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                                <GraduationCap className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Semester (optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Semester <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={semester}
                                onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
                                className="glass-input w-full px-4 py-3 pl-10 text-sm rounded-xl appearance-none cursor-pointer"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2371717a\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                <option value="">Select semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                    <option key={s} value={s} style={{ background: '#1c1c21', color: '#e4e4e7' }}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                                <BookOpen className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl text-xs text-red-300 animate-fade-in"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {error}
                        </div>
                    )}

                    <GlassButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        loading={loading}
                        icon={!loading ? <ArrowRight className="w-5 h-5" /> : undefined}
                    >
                        {loading ? 'Saving...' : 'Finish Setup'}
                    </GlassButton>
                </form>
            </div>
        </div>
    );
}
