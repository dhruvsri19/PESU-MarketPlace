'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnimatedAuthWrapper } from '@/components/AnimatedAuthWrapper';
import LoginPage from '@/app/login/page';

interface RootAuthManagerProps {
    children: ReactNode;
}

export function RootAuthManager({ children }: RootAuthManagerProps) {
    const { user, loading } = useAuth();

    // Show spinner while checking auth status
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--neon-purple)] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <AnimatedAuthWrapper isVisible={!user}>
                <LoginPage />
            </AnimatedAuthWrapper>

            {/* Render the Dashboard only if the user is authenticated */}
            {user && children}
        </>
    );
}
