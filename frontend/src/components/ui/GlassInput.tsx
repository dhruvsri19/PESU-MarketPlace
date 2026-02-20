'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--text-muted)' }}>
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              glass-input w-full px-5 py-3.5 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600
              ${icon ? 'pl-11' : ''}
              ${error ? 'border-red-500/50 focus:border-red-500' : 'focus:border-electric-violet'}
              ${className}
            `}
                        {...props}
                    />

                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

GlassInput.displayName = 'GlassInput';
