'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Heart, MessageCircle, PlusCircle, User } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function BottomNav() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = useCallback(async () => {
        if (!user) { setUnreadCount(0); return; }
        try {
            const { data } = await messagesApi.getUnreadCount();
            setUnreadCount(data.unread_count ?? 0);
        } catch { }
    }, [user]);

    useEffect(() => { fetchUnread(); }, [fetchUnread]);

    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('bottom-nav-unread-orange')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchUnread)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchUnread)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, fetchUnread]);

    if (!user) return null;

    const navItems = [
        { label: 'Home', icon: Home, href: '/' },
        { label: 'Saved', icon: Heart, href: '/wishlist' },
        { label: 'Sell', icon: PlusCircle, href: '/sell', isCenter: true },
        { label: 'Chat', icon: MessageCircle, href: '/messages', hasBadge: true },
        { label: 'Profile', icon: User, href: '/profile' },
    ];

    return (
        <div
            className="md:hidden"
            style={{
                position: 'fixed',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: '92%',
                maxWidth: '380px',
                display: 'flex',  // will be overridden by CSS .md:hidden if Tailwind works, otherwise always shows — OK
            }}
        >
            <nav style={{
                width: '100%',
                background: '#1e1e1e',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                padding: '10px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}>
                {navItems.map(item => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                padding: '6px 10px',
                                textDecoration: 'none',
                            }}
                        >
                            {item.isCenter ? (
                                <motion.div
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    style={{
                                        width: '48px', height: '48px',
                                        borderRadius: '14px',
                                        background: '#ff6b2b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 18px rgba(255,107,43,0.45)',
                                        transform: 'translateY(-8px)',
                                    }}
                                >
                                    <Icon style={{ width: '22px', height: '22px', color: '#fff' }} />
                                </motion.div>
                            ) : (
                                <>
                                    <Icon style={{
                                        width: '18px', height: '18px',
                                        color: isActive ? '#ff6b2b' : '#3a3a3a',
                                        transition: 'color 130ms ease',
                                    }} />
                                    <span style={{
                                        fontFamily: "'Syne', sans-serif",
                                        fontSize: '0.5rem', fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: isActive ? '#ff6b2b' : '#3a3a3a',
                                        transition: 'color 130ms ease',
                                    }}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                            {item.hasBadge && unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '2px', right: '4px',
                                    background: '#ff6b2b', color: '#fff',
                                    fontSize: '0.5rem', fontWeight: 800,
                                    borderRadius: '999px', minWidth: '14px', height: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 3px',
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
