'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    glow?: boolean;
    onClick?: () => void;
}

export function GlassCard({ children, className = '', hover = true, glow = false, onClick }: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        glass-card
        ${hover ? 'glass-hover cursor-pointer' : ''}
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
