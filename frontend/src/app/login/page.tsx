'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { ShieldCheck, Mail, ArrowRight, Sparkles, AlertCircle, KeyRound } from 'lucide-react';

type OtpStage = 'email' | 'otp';

export default function LoginPage() {
    const { user } = useAuth();

    // OTP state
    const [otpStage, setOtpStage] = useState<OtpStage>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // If already logged in, show nothing (RootAuthManager will handle rendering)
    if (user) return null;

    const handleSendOtp = async () => {
        if (!email.trim()) return setError('Please enter your email');
        if (!email.endsWith('@pes.edu') && !email.endsWith('@stu.pes.edu')) {
            return setError('Please use your PES University email (@pes.edu or @stu.pes.edu)');
        }

        setLoading(true);
        setError('');

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: { shouldCreateUser: true },
            });
            if (otpError) throw otpError;
            setOtpStage('otp');
            setSuccess('OTP sent! Check your inbox.');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) return setError('Please enter the OTP');

        setLoading(true);
        setError('');

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otp.trim(),
                type: 'email',
            });
            if (verifyError) throw verifyError;
            // Auth state change will be picked up by AuthContext
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--neon-purple)] opacity-10 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--neon-blue)] opacity-10 blur-[100px] rounded-full" />
            </div>

            {/* Login Card */}
            <div className="glass-heavy rounded-3xl p-8 sm:p-10 w-full max-w-md relative z-10 animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'var(--gradient-primary)' }}>
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                        PESU MARKETPLACE
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Sign in with your college email to start trading
                    </p>
                </div>

                {/* OTP Form */}
                <div className="space-y-5">
                    {otpStage === 'email' ? (
                        <>
                            <GlassInput
                                label="PESU Email"
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                placeholder="srn@stu.pes.edu"
                                icon={<Mail className="w-4 h-4" />}
                            />
                            <GlassButton
                                onClick={handleSendOtp}
                                variant="primary"
                                size="lg"
                                className="w-full"
                                loading={loading}
                                icon={!loading ? <ArrowRight className="w-5 h-5" /> : undefined}
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </GlassButton>
                        </>
                    ) : (
                        <>
                            {/* Email display */}
                            <div className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-sm text-blue-200 truncate">{email}</span>
                                <button
                                    onClick={() => { setOtpStage('email'); setOtp(''); setError(''); setSuccess(''); }}
                                    className="ml-auto text-[11px] text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                                >
                                    Change
                                </button>
                            </div>

                            <GlassInput
                                label="One-Time Password"
                                type="text"
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                                placeholder="Enter 6-digit code"
                                icon={<KeyRound className="w-4 h-4" />}
                                maxLength={6}
                            />

                            <GlassButton
                                onClick={handleVerifyOtp}
                                variant="primary"
                                size="lg"
                                className="w-full"
                                loading={loading}
                                icon={!loading ? <ShieldCheck className="w-5 h-5" /> : undefined}
                            >
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </GlassButton>
                        </>
                    )}

                    {/* Status Messages */}
                    {error && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs animate-fade-in"
                            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-px" />
                            <span className="text-red-300">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs animate-fade-in"
                            style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-px" />
                            <span className="text-emerald-300">{success}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[11px] mt-8" style={{ color: 'var(--text-muted)' }}>
                    Only PES University email addresses are accepted.
                </p>
            </div>
        </div>
    );
}
