'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
    ({ label, error, icon, className = '', style, onFocus, onBlur, ...props }, ref) => {
        return (
            <div style={{ width: '100%' }}>
                {label && (
                    <label style={{
                        display: 'block',
                        fontFamily: "'Syne', sans-serif",
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#555',
                        marginBottom: '8px',
                    }}>
                        {label}
                    </label>
                )}
                <div style={{ position: 'relative' }}>
                    {icon && (
                        <div style={{
                            position: 'absolute', left: '14px',
                            top: '50%', transform: 'translateY(-50%)',
                            color: '#555', display: 'flex', alignItems: 'center',
                            pointerEvents: 'none',
                        }}>
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={className}
                        style={{
                            width: '100%',
                            padding: icon ? '12px 16px 12px 42px' : '12px 16px',
                            fontSize: '0.875rem',
                            fontFamily: "'Inter', sans-serif",
                            color: '#ffffff',
                            background: '#242424',
                            border: error
                                ? '1.5px solid rgba(255,80,80,0.6)'
                                : '1.5px solid rgba(255,255,255,0.07)',
                            borderRadius: '12px',
                            outline: 'none',
                            transition: 'border-color 150ms ease, box-shadow 150ms ease',
                            ...style,
                        }}
                        onFocus={e => {
                            if (!error) {
                                e.currentTarget.style.borderColor = '#ff6b2b';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,43,0.18)';
                            }
                            onFocus?.(e);
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = error
                                ? 'rgba(255,80,80,0.6)' : 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.boxShadow = 'none';
                            onBlur?.(e);
                        }}
                        {...props}
                    />
                </div>
                {error && (
                    <p style={{
                        marginTop: '6px', fontSize: '0.75rem', color: '#ff4d4d',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

GlassInput.displayName = 'GlassInput';
