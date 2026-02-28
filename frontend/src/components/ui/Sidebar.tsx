'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Home, Heart, MessageCircle, User, LogOut,
    LayoutGrid, Plus, X, Menu
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const NAV_LINKS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Listings', href: '/profile', icon: LayoutGrid },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
    { label: 'Messages', href: '/messages', icon: MessageCircle },
    { label: 'Profile', href: '/profile', icon: User },
];

export function Sidebar() {
    const { user, signOut, profile, loading } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
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
            .channel('sidebar-unread')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchUnread)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchUnread)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, fetchUnread]);

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    /* ── Shared sidebar content ── */
    const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '24px 16px',
            overflowY: 'auto',
        }}>
            {/* Logo */}
            <Link
                href="/"
                onClick={onLinkClick}
                style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '36px',
                    padding: '0 4px',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: '34px', height: '34px',
                    background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Plus style={{ width: '18px', height: '18px', color: '#fff', strokeWidth: 2.5 }} />
                </div>
                <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                }}>
                    MarketPlace
                </span>
            </Link>

            {/* Nav Links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {NAV_LINKS.map((link, i) => {
                    const active = isActive(link.href);
                    const Icon = link.icon;
                    const hasUnread = link.href === '/messages' && unreadCount > 0;

                    return (
                        <Link
                            key={`${link.href}-${link.label}`}
                            href={link.href}
                            onClick={onLinkClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: active ? 600 : 500,
                                color: active ? '#ffffff' : '#555555',
                                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                                transition: 'background 150ms ease, color 150ms ease',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            onMouseEnter={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                    (e.currentTarget as HTMLElement).style.color = '#ccc';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = '#555';
                                }
                            }}
                        >
                            {/* Pink left indicator for active */}
                            {active && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '18%',
                                    bottom: '18%',
                                    width: '3px',
                                    background: 'linear-gradient(180deg, #ff2d78, #7c3aed)',
                                    borderRadius: '0 3px 3px 0',
                                }} />
                            )}
                            <Icon style={{
                                width: '17px', height: '17px',
                                color: active ? '#ff2d78' : 'currentColor',
                                flexShrink: 0,
                            }} />
                            <span style={{ flex: 1 }}>{link.label}</span>
                            {hasUnread && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                                    color: '#fff',
                                    fontSize: '0.55rem',
                                    fontWeight: 800,
                                    borderRadius: '999px',
                                    minWidth: '16px', height: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 4px',
                                    flexShrink: 0,
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}

                {/* Sell Item button */}
                {user && (
                    <Link
                        href="/sell"
                        onClick={onLinkClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '999px',
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                            boxShadow: '0 4px 20px rgba(255,45,120,0.3)',
                            marginTop: '16px',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    >
                        <Plus style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                        Sell Item
                    </Link>
                )}
            </nav>

            {/* Bottom: user + sign out */}
            {user && !loading && (
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '16px',
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                        overflow: 'hidden', position: 'relative', flexShrink: 0,
                    }}>
                        {profile?.avatar_url ? (
                            <Image src={profile.avatar_url} alt="" fill sizes="32px" style={{ objectFit: 'cover' }} />
                        ) : (
                            profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '0.78rem', fontWeight: 600, color: '#fff',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {profile?.full_name || 'User'}
                        </div>
                        <div style={{
                            fontSize: '0.65rem', color: '#444',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {user.email}
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        title="Sign out"
                        style={{
                            background: 'transparent', border: 'none',
                            color: '#444', cursor: 'pointer', padding: '4px',
                            display: 'flex', borderRadius: '6px',
                            transition: 'color 140ms ease', flexShrink: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ff2d78'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}
                    >
                        <LogOut style={{ width: '15px', height: '15px' }} />
                    </button>
                </div>
            )}

            {!user && !loading && (
                <Link href="/login" onClick={onLinkClick} style={{
                    display: 'block',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginTop: '16px',
                    flexShrink: 0,
                }}>
                    Get Started
                </Link>
            )}
        </div>
    );

    return (
        <>
            {/* ── Desktop Sidebar — uses CSS class `.sidebar-desktop` (shown at ≥768px) ── */}
            <aside
                className="sidebar-desktop"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '240px',
                    background: '#111111',
                    zIndex: 50,
                    flexDirection: 'column',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                <SidebarContent />
            </aside>

            {/* ── Mobile Top Bar — uses CSS class `.sidebar-mobile-bar` (shown below 768px) ── */}
            <div
                className="sidebar-mobile-bar"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 60,
                    background: 'rgba(13,13,13,0.97)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                }}
            >
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px',
                        background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Plus style={{ width: '14px', height: '14px', color: '#fff' }} />
                    </div>
                    <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 800, fontSize: '0.95rem', color: '#fff',
                    }}>
                        MarketPlace
                    </span>
                </Link>
                <button
                    onClick={() => setMobileOpen(true)}
                    style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                >
                    <Menu style={{ width: '22px', height: '22px' }} />
                </button>
            </div>

            {/* ── Mobile Drawer ── */}
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
                                background: 'rgba(0,0,0,0.75)',
                                zIndex: 70,
                            }}
                        />
                        <motion.aside
                            key="drawer"
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            style={{
                                position: 'fixed',
                                top: 0, left: 0, bottom: 0,
                                width: '260px',
                                background: '#111111',
                                zIndex: 80,
                                overflowY: 'auto',
                            }}
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: 'none', borderRadius: '8px',
                                    color: '#888', cursor: 'pointer', padding: '6px',
                                    display: 'flex',
                                }}
                            >
                                <X style={{ width: '16px', height: '16px' }} />
                            </button>
                            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
