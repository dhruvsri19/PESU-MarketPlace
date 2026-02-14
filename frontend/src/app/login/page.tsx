'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { ShieldCheck, Mail, ArrowRight, Sparkles, AlertCircle, KeyRound } from 'lucide-react';

export default function LoginPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [stage, setStage] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const validatePESUEmail = (email: string) => {
        return email.endsWith('@pesu.pes.edu') || email.endsWith('@stu.pes.edu');
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validatePESUEmail(email)) {
            return setError('Please use your PES University email address (@pesu.pes.edu or @stu.pes.edu)');
        }

        setLoading(true);
        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                }
            });

            if (otpError) throw otpError;

            setStage('otp');
            setSuccess('6-digit code sent to your PESU email!');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (verifyError) throw verifyError;

            // Redirect to onboarding or home
            router.push('/onboarding');
        } catch (err: any) {
            setError(err.message || 'Invalid OTP. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative">
            {/* Ambient background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--neon-purple)] opacity-10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md animate-slide-up">
                <div className="glass-heavy rounded-3xl p-8 sm:p-10 relative overflow-hidden">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-transparent opacity-50" />

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 glass neon-border">
                            <ShieldCheck className="w-8 h-8 text-[var(--neon-purple)]" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 neon-text">
                            {stage === 'email' ? 'PESU Login' : 'Verify Identity'}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {stage === 'email'
                                ? 'The exclusive marketplace for PES University students'
                                : `Verification code sent to ${email}`}
                        </p>
                    </div>

                    <form onSubmit={stage === 'email' ? handleSendOtp : handleVerifyOtp} className="space-y-6">
                        {stage === 'email' ? (
                            <GlassInput
                                label="PESU Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@pesu.pes.edu"
                                icon={<Mail className="w-4 h-4" />}
                                required
                            />
                        ) : (
                            <div className="space-y-4">
                                <GlassInput
                                    label="6-Digit OTP"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    icon={<KeyRound className="w-4 h-4" />}
                                    required
                                    className="text-center tracking-[0.5em] font-mono text-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => setStage('email')}
                                    className="text-xs hover:text-white transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Change email address
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-fade-in"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in"
                                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <Sparkles className="w-4 h-4 flex-shrink-0" />
                                {success}
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
                            {stage === 'email' ? 'Send OTP' : 'Verify & Sign In'}
                        </GlassButton>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                            Verified PESU Authentication
                        </p>
                    </div>
                </div>

                <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Access restricted to PES University faculty and students.
                </p>
            </div>
        </div>
    );
}
