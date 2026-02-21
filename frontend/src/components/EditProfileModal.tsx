'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { X, Save, Loader2, MapPin, GraduationCap, BookOpen, User } from 'lucide-react';

const CAMPUSES = [
    { id: 'RR', name: 'Ring Road Campus' },
    { id: 'ECC', name: 'Electronic City Campus' },
];

const BRANCHES = [
    'CSE', 'AIML', 'ECE', 'EEE', 'ME', 'BT', 'BBA', 'BCOM', 'BCA', 'Other'
];

interface EditProfileModalProps {
    user: { id: string };
    profile: {
        full_name?: string;
        bio?: string;
        campus?: string;
        branch?: string;
        semester?: number;
    };
    isFirstTime?: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function EditProfileModal({ user, profile, isFirstTime, onClose, onUpdate }: EditProfileModalProps) {
    const [fullName, setFullName] = useState(profile.full_name || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [campus, setCampus] = useState(profile.campus || '');
    const [branch, setBranch] = useState(profile.branch || '');
    const [semester, setSemester] = useState<number | ''>(profile.semester || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!fullName.trim()) return setError('Name is required');
        setSaving(true);
        setError('');

        try {
            // Uses authApi.updateProfile → public.profiles table (NOT auth.updateUser)
            await authApi.updateProfile({
                full_name: fullName.trim(),
                bio: bio.trim(),
                campus: campus || undefined,
                branch: branch || undefined,
                ...(semester ? { semester: Number(semester) } : {}),
            });
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={!isFirstTime ? onClose : undefined}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Modal */}
            <div className="glass-heavy rounded-2xl w-full max-w-md relative z-10 animate-slide-up overflow-hidden"
                onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b"
                    style={{ borderColor: 'var(--glass-border)' }}>
                    <h2 className="text-lg font-bold text-white">
                        {isFirstTime ? 'Complete Your Profile' : 'Edit Profile'}
                    </h2>
                    {!isFirstTime && (
                        <button onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: 'var(--text-muted)' }}>
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="glass-input w-full px-4 py-3 pl-10 text-sm rounded-xl text-white placeholder:text-[var(--text-muted)]"
                            />
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: 'var(--text-muted)' }}>
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell other students about yourself..."
                            rows={3}
                            maxLength={200}
                            className="glass-input w-full px-4 py-3 text-sm rounded-xl text-white placeholder:text-[var(--text-muted)] resize-none"
                        />
                        <p className="text-right text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {bio.length}/200
                        </p>
                    </div>

                    {/* Campus */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: 'var(--text-muted)' }}>
                            Campus
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {CAMPUSES.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCampus(c.id)}
                                    className={`p-3 rounded-xl border transition-all text-sm flex flex-col items-center gap-2 ${campus === c.id
                                        ? 'border-[var(--neon-blue)] bg-[rgba(59,130,246,0.12)] text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                                        : 'glass border-transparent text-[var(--text-muted)] hover:bg-white/5'
                                        }`}
                                >
                                    <MapPin className={`w-4 h-4 ${campus === c.id ? 'text-blue-400' : ''}`} />
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Branch */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: 'var(--text-muted)' }}>
                            Branch / Department
                        </label>
                        <div className="relative">
                            <select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="glass-input w-full px-4 py-3 pl-10 text-sm rounded-xl appearance-none cursor-pointer text-white"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                }}
                            >
                                <option value="" disabled>Select branch</option>
                                {BRANCHES.map((b) => (
                                    <option key={b} value={b} style={{ background: '#1c1c21', color: '#e4e4e7' }}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Semester */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: 'var(--text-muted)' }}>
                            Semester <span className="text-[9px] normal-case">(optional)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={semester}
                                onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
                                className="glass-input w-full px-4 py-3 pl-10 text-sm rounded-xl appearance-none cursor-pointer text-white"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                }}
                            >
                                <option value="">Select semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                    <option key={s} value={s} style={{ background: '#1c1c21', color: '#e4e4e7' }}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-xl text-xs text-red-300"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex items-center gap-3"
                    style={{ borderColor: 'var(--glass-border)' }}>
                    {!isFirstTime && (
                        <button onClick={onClose}
                            className="flex-1 btn-glass py-2.5 text-sm rounded-xl font-medium">
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 text-sm rounded-xl font-semibold text-white transition-all
                            hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
