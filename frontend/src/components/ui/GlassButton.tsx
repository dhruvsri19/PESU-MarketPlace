'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

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
    style,
    onClick,
    ...props
}: GlassButtonProps) {
    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: '7px 18px', fontSize: '0.72rem' },
        md: { padding: '10px 24px', fontSize: '0.8rem' },
        lg: { padding: '14px 32px', fontSize: '0.875rem' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: '#ff6b2b',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            boxShadow: '0 4px 20px rgba(255,107,43,0.3)',
        },
        glass: {
            background: 'rgba(255,255,255,0.05)',
            color: '#a0a0a0',
            border: '1.5px solid rgba(255,255,255,0.1)',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
        },
        ghost: {
            background: 'transparent',
            color: '#666',
            border: 'none',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
        },
    };

    return (
        <motion.button
            whileHover={!disabled && !loading ? {
                scale: 1.03,
                boxShadow: variant === 'primary' ? '0 6px 28px rgba(255,107,43,0.5)' : undefined
            } : {}}
            whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '999px',
                cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
                opacity: (loading || disabled) ? 0.4 : 1,
                transition: 'box-shadow 140ms ease, opacity 140ms ease',
                whiteSpace: 'nowrap',
                ...sizeStyles[size],
                ...variantStyles[variant],
                ...style,
            }}
            disabled={loading || disabled}
            onClick={onClick}
            className={className}
            {...(props as any)}
        >
            {loading ? (
                <div style={{
                    width: '15px', height: '15px',
                    border: '2px solid rgba(255,255,255,0.25)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
            ) : icon ? icon : null}
            {children}
        </motion.button>
    );
}
