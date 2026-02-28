'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Plus, ShoppingBag, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function Navbar() {
    const { user, signOut, profile, loading } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [scrolled, setScrolled] = useState(false);

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
            .channel('navbar-unread')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchUnread)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchUnread)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, fetchUnread]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Used only in mobile drawer
    const navLinks = user ? [
        { label: 'Browse', href: '/' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'Messages', href: '/messages', hasBadge: true },
        { label: 'Profile', href: '/profile' },
    ] : [];

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <>
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: scrolled ? 'rgba(26,26,26,0.96)' : '#1a1a1a',
                backdropFilter: scrolled ? 'blur(16px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 200ms ease',
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 24px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                }}>
                    {/* Logo — left */}
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
                        <div style={{
                            width: '32px', height: '32px',
                            background: '#ff6b2b',
                            borderRadius: '9px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(255,107,43,0.4)',
                        }}>
                            <ShoppingBag style={{ width: '16px', height: '16px', color: '#fff' }} />
                        </div>
                        <span style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.02em',
                        }}>
                            Market<span style={{ color: '#ff6b2b' }}>Place</span>
                        </span>
                    </Link>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user ? (
                            <>
                                {/* Sell Item button */}
                                <Link href="/sell" style={{ textDecoration: 'none' }}>
                                    <motion.div
                                        whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(255,107,43,0.5)' }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            background: '#ff6b2b',
                                            color: '#fff',
                                            borderRadius: '999px',
                                            padding: '8px 20px',
                                            fontFamily: "'Syne', sans-serif",
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            whiteSpace: 'nowrap',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            boxShadow: '0 4px 16px rgba(255,107,43,0.3)',
                                        }}
                                    >
                                        <Plus style={{ width: '13px', height: '13px' }} />
                                        Sell Item
                                    </motion.div>
                                </Link>

                                {/* User avatar */}
                                <Link href="/profile" style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        width: '34px', height: '34px',
                                        borderRadius: '50%',
                                        background: '#ff6b2b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                                        overflow: 'hidden', position: 'relative',
                                        border: '2px solid rgba(255,107,43,0.3)',
                                    }}>
                                        {profile?.avatar_url ? (
                                            <Image src={profile.avatar_url} alt="" fill sizes="34px" style={{ objectFit: 'cover' }} />
                                        ) : (
                                            profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                    </div>
                                </Link>

                                {/* Sign out */}
                                <button
                                    onClick={signOut}
                                    title="Sign out"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '9px',
                                        color: '#555', cursor: 'pointer',
                                        width: '34px', height: '34px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'color 140ms ease, border-color 140ms ease',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ff6b2b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,43,0.3)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                >
                                    <LogOut style={{ width: '14px', height: '14px' }} />
                                </button>

                                {/* Mobile hamburger */}
                                <button
                                    onClick={() => setMobileOpen(true)}
                                    style={{
                                        background: 'transparent', border: 'none',
                                        color: '#888', cursor: 'pointer', padding: '4px', display: 'flex',
                                    }}
                                    className="md:hidden"
                                >
                                    <Menu style={{ width: '22px', height: '22px' }} />
                                </button>
                            </>
                        ) : (
                            !loading && (
                                <Link href="/login" style={{ textDecoration: 'none' }}>
                                    <motion.div
                                        whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(255,107,43,0.5)' }}
                                        whileTap={{ scale: 0.97 }}
                                        style={{
                                            background: '#ff6b2b',
                                            color: '#fff',
                                            borderRadius: '999px',
                                            padding: '9px 24px',
                                            fontFamily: "'Syne', sans-serif",
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            boxShadow: '0 4px 16px rgba(255,107,43,0.3)',
                                        }}
                                    >
                                        Get Started →
                                    </motion.div>
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                position: 'fixed', inset: 0,
                                background: 'rgba(0,0,0,0.7)',
                                zIndex: 200,
                            }}
                        />
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{
                                position: 'fixed',
                                top: 0, right: 0, bottom: 0,
                                width: '260px',
                                background: '#1e1e1e',
                                zIndex: 201,
                                padding: '24px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    alignSelf: 'flex-end',
                                    background: 'rgba(255,255,255,0.06)', border: 'none',
                                    borderRadius: '8px', color: '#888', cursor: 'pointer', padding: '6px',
                                    display: 'flex', marginBottom: '16px',
                                }}
                            >
                                <X style={{ width: '16px', height: '16px' }} />
                            </button>
                            {navLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        textDecoration: 'none',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        fontFamily: "'Syne', sans-serif",
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        color: isActive(link.href) ? '#fff' : '#555',
                                        background: isActive(link.href) ? 'rgba(255,107,43,0.12)' : 'transparent',
                                        position: 'relative',
                                    }}
                                >
                                    {link.label}
                                    {link.hasBadge && unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '8px', right: '12px',
                                            background: '#ff6b2b', color: '#fff',
                                            fontSize: '0.55rem', fontWeight: 800,
                                            borderRadius: '999px', minWidth: '16px', height: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0 4px',
                                        }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            ))}
                            {user && (
                                <Link href="/sell" onClick={() => setMobileOpen(false)} style={{
                                    textDecoration: 'none', marginTop: '12px',
                                    background: '#ff6b2b', color: '#fff',
                                    padding: '13px 16px', borderRadius: '999px',
                                    fontFamily: "'Syne', sans-serif", fontWeight: 700,
                                    fontSize: '0.85rem', textAlign: 'center',
                                    boxShadow: '0 4px 16px rgba(255,107,43,0.35)',
                                }}>
                                    + Sell Item
                                </Link>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
