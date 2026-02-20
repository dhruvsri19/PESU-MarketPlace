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
        primary: 'bg-white text-black hover:opacity-90 active:scale-[0.98] transition-all rounded-xl shadow-lg',
        glass: 'bg-zinc-800/80 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white active:scale-[0.98] backdrop-blur-md transition-all rounded-xl',
        ghost: 'bg-transparent border-none text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer',
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
