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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a1a',
            }}>
                <div style={{
                    width: '34px', height: '34px',
                    border: '3px solid rgba(255,107,43,0.15)',
                    borderTopColor: '#ff6b2b',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
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
