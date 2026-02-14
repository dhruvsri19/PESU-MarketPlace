'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search for books, electronics, notes...' }: SearchBarProps) {
    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}>
                <Search className="w-5 h-5" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="glass-input w-full pl-12 pr-4 py-3.5 text-sm rounded-2xl"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    Clear
                </button>
            )}
        </div>
    );
}
