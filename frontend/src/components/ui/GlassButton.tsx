'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'glass' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: ReactNode;
    loading?: boolean;
    children: ReactNode;
}

export function GlassButton({
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}: GlassButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3.5 text-base',
    };

    const variantClasses = {
        primary: 'btn-primary',
        glass: 'btn-glass',
        ghost: 'bg-transparent border-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer',
    };

    return (
        <button
            className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        inline-flex items-center justify-center gap-2 font-medium
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            disabled={loading || disabled}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : icon ? (
                icon
            ) : null}
            {children}
        </button>
    );
}
