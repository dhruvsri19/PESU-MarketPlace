'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Search, Heart, MessageCircle, Plus, LogOut, Menu, X, ShoppingBag, User } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function Navbar() {
    const { user, signOut, loading } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    /* ── Fetch unread count ── */
    const fetchUnread = useCallback(async () => {
        if (!user) { setUnreadCount(0); return; }
        try {
            const { data } = await messagesApi.getUnreadCount();
            setUnreadCount(data.unread_count ?? 0);
        } catch {
            // silently fail — badge just stays at 0
        }
    }, [user]);

    useEffect(() => {
        fetchUnread();
    }, [fetchUnread]);

    /* ── Realtime: re-fetch count on new messages ── */
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('navbar-unread')
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

    /* ── Badge component ── */
    const UnreadBadge = () =>
        unreadCount > 0 ? (
            <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
                    rounded-full text-[10px] font-bold leading-none px-1 animate-fade-in"
                style={{
                    background: '#ef4444',
                    color: 'white',
                    boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                }}
            >
                {unreadCount > 99 ? '99+' : unreadCount}
            </span>
        ) : null;

    return (
        <nav className="sticky top-0 z-[100] glass-heavy">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--gradient-primary)' }}>
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold neon-text">UniMart</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-2">
                        {user && (
                            <>
                                <Link href="/sell" className="btn-glass flex items-center gap-2 text-sm">
                                    <Plus className="w-4 h-4" />
                                    Sell
                                </Link>
                                <Link href="/wishlist"
                                    className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <Heart className="w-5 h-5" />
                                </Link>
                                <Link href="/messages"
                                    className="relative p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <MessageCircle className="w-5 h-5" />
                                    <UnreadBadge />
                                </Link>
                                <Link href="/profile"
                                    className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <User className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={signOut}
                                    className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        {!user && !loading && (
                            <Link href="/login" className="btn-primary text-sm">
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-xl hover:bg-white/5"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ color: 'var(--text-secondary)' }}>
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden glass border-t"
                    style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="px-4 py-3 space-y-2">
                        {user ? (
                            <>
                                <Link href="/sell" onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <Plus className="w-5 h-5" style={{ color: 'var(--neon-purple)' }} />
                                    Sell an Item
                                </Link>
                                <Link href="/wishlist" onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <Heart className="w-5 h-5" style={{ color: 'var(--neon-pink)' }} />
                                    Wishlist
                                </Link>
                                <Link href="/messages" onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <div className="relative">
                                        <MessageCircle className="w-5 h-5" style={{ color: 'var(--neon-blue)' }} />
                                        <UnreadBadge />
                                    </div>
                                    Messages
                                    {unreadCount > 0 && (
                                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/profile" onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <User className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                                    Profile
                                </Link>
                                <button onClick={() => { signOut(); setMobileOpen(false); }}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors w-full text-left"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setMobileOpen(false)}
                                className="btn-primary block text-center text-sm w-full">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
