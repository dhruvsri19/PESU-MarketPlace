'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Heart, MessageCircle, PlusCircle, User } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function BottomNav() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    /* ── Fetch unread count ── */
    const fetchUnread = useCallback(async () => {
        if (!user) { setUnreadCount(0); return; }
        try {
            const { data } = await messagesApi.getUnreadCount();
            setUnreadCount(data.unread_count ?? 0);
        } catch {
            // silently fail
        }
    }, [user]);

    useEffect(() => {
        fetchUnread();
    }, [fetchUnread]);

    /* ── Realtime: re-fetch count on new messages ── */
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('bottom-nav-unread')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => { fetchUnread(); },
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => { fetchUnread(); },
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, fetchUnread]);

    if (!user) return null;

    const navItems = [
        { label: 'Home', icon: Home, href: '/' },
        { label: 'Saved', icon: Heart, href: '/wishlist', color: 'var(--neon-pink)' },
        { label: 'Sell', icon: PlusCircle, href: '/sell', color: 'var(--neon-purple)', isCenter: true },
        { label: 'Messages', icon: MessageCircle, href: '/messages', color: 'var(--neon-blue)', hasBadge: true },
        { label: 'Profile', icon: User, href: '/profile' },
    ];

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px]">
            <nav className="glass-heavy rounded-2xl p-2 flex items-center justify-between shadow-2xl border border-white/10">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                relative flex flex-col items-center justify-center transition-all duration-200
                                ${item.isCenter ? 'p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg -translate-y-4' : 'flex-1 p-2'}
                            `}
                        >
                            <Icon
                                className={`w-6 h-6 ${isActive && !item.isCenter ? 'scale-110' : ''}`}
                                style={{
                                    color: isActive || item.isCenter ? (item.isCenter ? 'white' : 'var(--text-primary)') : 'var(--text-muted)',
                                    fill: isActive && item.href === '/wishlist' ? item.color : 'none'
                                }}
                            />

                            {!item.isCenter && (
                                <span className="text-[10px] mt-1 font-medium"
                                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {item.label}
                                </span>
                            )}

                            {item.hasBadge && unreadCount > 0 && (
                                <span
                                    className="absolute top-1 right-2 min-w-[16px] h-[16px] flex items-center justify-center
                                        rounded-full text-[9px] font-bold leading-none px-1 animate-fade-in"
                                    style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                                    }}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}

                            {isActive && !item.isCenter && (
                                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white/40" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
