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
        <nav className="sticky top-0 z-[100] border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
                            <ShoppingBag className="w-4.5 h-4.5 text-black" />
                        </div>
                        <span className="text-lg font-black tracking-tighter text-white">PESU MARKETPLACE</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {loading ? (
                            <div className="w-24 h-10 bg-zinc-800/50 animate-pulse rounded-xl" />
                        ) : user ? (
                            <>
                                <Link href="/sell" className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:opacity-90 transition-all mr-2">
                                    Sell Item
                                </Link>
                                <Link href="/wishlist"
                                    className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                                    <Heart className="w-5 h-5" />
                                </Link>
                                <Link href="/messages"
                                    className="relative p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                                    <MessageCircle className="w-5 h-5" />
                                    <UnreadBadge />
                                </Link>
                                <Link href="/profile"
                                    className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                                    <User className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={signOut}
                                    className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="px-6 py-2 rounded-xl text-sm font-bold bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all">
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-xl text-zinc-400 hover:bg-zinc-800/50"
                        onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-2xl">
                    <div className="px-4 py-6 space-y-4">
                        {loading ? (
                            <div className="h-14 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
                        ) : user ? (
                            <>
                                <Link href="/sell" onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white text-black font-bold">
                                    <Plus className="w-5 h-5" />
                                    Sell an Item
                                </Link>
                                <div className="grid grid-cols-3 gap-2">
                                    <Link href="/wishlist" onClick={() => setMobileOpen(false)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                                        <Heart className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase">Wish</span>
                                    </Link>
                                    <Link href="/messages" onClick={() => setMobileOpen(false)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 relative">
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase">Chat</span>
                                    </Link>
                                    <Link href="/profile" onClick={() => setMobileOpen(false)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                                        <User className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase">Profile</span>
                                    </Link>
                                </div>
                                <button onClick={() => { signOut(); setMobileOpen(false); }}
                                    className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-400 font-bold w-full text-sm">
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setMobileOpen(false)}
                                className="block p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center font-bold text-white">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );

}
