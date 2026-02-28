'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Tag } from 'lucide-react';
import Link from 'next/link';

const floatingBadges = [
    { label: '500+ Students', cls: 'float-badge-1', top: '18%', left: '4%' },
    { label: '1000+ Listings', cls: 'float-badge-2', top: '55%', left: '2%' },
    { label: 'PES University', cls: 'float-badge-3', top: '30%', right: '3%' },
    { label: 'Free to join', cls: 'float-badge-4', top: '72%', right: '5%' },
];

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export function LandingHero() {
    return (
        <div style={{ color: '#fff', overflow: 'hidden' }}>

            {/* ── Hero Section ── */}
            <section style={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                padding: '60px 48px',
                maxWidth: '1300px',
                margin: '0 auto',
                gap: '60px',
            }}>
                {/* Floating badges */}
                {floatingBadges.map((b, i) => (
                    <div
                        key={i}
                        className={b.cls}
                        style={{
                            position: 'absolute',
                            top: b.top,
                            left: b.left,
                            right: b.right,
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '999px',
                            padding: '8px 18px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            color: '#ccc',
                            whiteSpace: 'nowrap',
                            zIndex: 1,
                            pointerEvents: 'none',
                        }}
                    >
                        {b.label}
                    </div>
                ))}

                {/* Left — SVG Illustration (CSS-drawn marketplace scene) */}
                <div style={{
                    flex: '0 0 auto',
                    width: 'clamp(280px, 38vw, 520px)',
                    aspectRatio: '1',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {/* SVG marketplace illustration */}
                    <svg
                        viewBox="0 0 480 480"
                        style={{ width: '100%', height: '100%' }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Background circle */}
                        <circle cx="240" cy="240" r="210" fill="rgba(255,107,43,0.06)" />
                        <circle cx="240" cy="240" r="170" fill="rgba(255,107,43,0.04)" />

                        {/* Store shelf/storefront */}
                        <rect x="80" y="200" width="320" height="180" rx="16" fill="#242424" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                        <rect x="80" y="200" width="320" height="48" rx="16" fill="#ff6b2b" opacity="0.85" />
                        <rect x="90" y="210" width="302" height="28" rx="8" fill="rgba(255,255,255,0.12)" />

                        {/* Store sign text dots */}
                        <circle cx="150" cy="224" r="4" fill="rgba(255,255,255,0.5)" />
                        <circle cx="165" cy="224" r="4" fill="rgba(255,255,255,0.5)" />
                        <circle cx="180" cy="224" r="4" fill="rgba(255,255,255,0.5)" />

                        {/* Product cards on shelf */}
                        <rect x="100" y="268" width="76" height="90" rx="10" fill="#2e2e2e" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                        <rect x="100" y="268" width="76" height="46" rx="8" fill="rgba(255,107,43,0.2)" />
                        <rect x="190" y="268" width="76" height="90" rx="10" fill="#2e2e2e" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                        <rect x="190" y="268" width="76" height="46" rx="8" fill="rgba(245,197,24,0.15)" />
                        <rect x="280" y="268" width="76" height="90" rx="10" fill="#2e2e2e" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                        <rect x="280" y="268" width="76" height="46" rx="8" fill="rgba(255,107,43,0.12)" />

                        {/* Price tags */}
                        <rect x="108" y="324" width="58" height="18" rx="9" fill="#ff6b2b" opacity="0.9" />
                        <rect x="198" y="324" width="58" height="18" rx="9" fill="#f5c518" opacity="0.8" />
                        <rect x="288" y="324" width="58" height="18" rx="9" fill="#ff6b2b" opacity="0.7" />

                        {/* Person 1 — left */}
                        <circle cx="148" cy="150" r="28" fill="#2a2a2a" stroke="rgba(255,107,43,0.3)" strokeWidth="2" />
                        <circle cx="148" cy="142" r="13" fill="#ff6b2b" opacity="0.7" />
                        <rect x="128" y="165" width="40" height="30" rx="8" fill="#ff6b2b" opacity="0.4" />

                        {/* Person 2 — right */}
                        <circle cx="320" cy="150" r="28" fill="#2a2a2a" stroke="rgba(245,197,24,0.3)" strokeWidth="2" />
                        <circle cx="320" cy="142" r="13" fill="#f5c518" opacity="0.6" />
                        <rect x="300" y="165" width="40" height="30" rx="8" fill="#f5c518" opacity="0.3" />

                        {/* Arrow between them */}
                        <path d="M178 150 L176 150 M174 145 L176 150 L174 155" stroke="#ff6b2b" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                        <path d="M283 150 L282 150 M284 145 L282 150 L284 155" stroke="#ff6b2b" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                        <line x1="178" y1="150" x2="290" y2="150" stroke="rgba(255,107,43,0.3)" strokeWidth="1.5" strokeDasharray="6,4" />

                        {/* Money/coin floating */}
                        <circle cx="234" cy="130" r="16" fill="#f5c518" opacity="0.8" />
                        <text x="234" y="135" textAnchor="middle" fontSize="14" fill="#1a1a1a" fontWeight="bold">₹</text>

                        {/* Stars scattered */}
                        <circle cx="60" cy="100" r="4" fill="#ff6b2b" opacity="0.5" />
                        <circle cx="400" cy="120" r="3" fill="#f5c518" opacity="0.6" />
                        <circle cx="420" cy="300" r="5" fill="#ff6b2b" opacity="0.35" />
                        <circle cx="50" cy="330" r="4" fill="#f5c518" opacity="0.4" />

                        {/* Chat bubble */}
                        <rect x="340" y="80" width="80" height="40" rx="12" fill="#242424" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <polygon points="360,120 370,120 365,132" fill="#242424" />
                        <rect x="352" y="93" width="56" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
                        <rect x="352" y="104" width="40" height="6" rx="3" fill="rgba(255,107,43,0.5)" />
                    </svg>
                </div>

                {/* Right — Headline and CTA */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="visible"
                    style={{ flex: 1, zIndex: 2 }}
                >
                    <motion.div
                        variants={fadeUp}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255,107,43,0.1)',
                            border: '1px solid rgba(255,107,43,0.25)',
                            borderRadius: '999px',
                            padding: '5px 16px',
                            marginBottom: '22px',
                        }}
                    >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b2b', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff6b2b' }}>
                            Now live at PES University
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                            fontWeight: 800,
                            lineHeight: 1.0,
                            letterSpacing: '-0.03em',
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            margin: '0 0 18px',
                        }}
                    >
                        The easiest place to<br />
                        buy &amp; sell<br />
                        <span style={{ color: '#ff6b2b' }}>on campus</span>
                        <span style={{ color: '#f5c518', fontSize: '0.7em', verticalAlign: 'super', marginLeft: '6px' }}>✦</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '1rem',
                            color: '#666',
                            lineHeight: 1.65,
                            margin: '0 0 36px',
                            maxWidth: '420px',
                        }}
                    >
                        Student-to-student marketplace for PESU. Textbooks, electronics, hostel essentials — safe, fast, completely free.
                    </motion.p>

                    <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <Link href="/login" style={{ textDecoration: 'none' }}>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 8px 36px rgba(255,107,43,0.55)' }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    background: '#ff6b2b',
                                    color: '#fff', border: 'none',
                                    borderRadius: '999px',
                                    padding: '16px 38px',
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: '0.95rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 4px 24px rgba(255,107,43,0.35)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Get Started <ArrowRight style={{ width: '16px', height: '16px' }} />
                            </motion.button>
                        </Link>
                        <span style={{ color: '#444', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>Free forever</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Stats Strip ── */}
            <section style={{ background: '#242424', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                    maxWidth: '900px', margin: '0 auto',
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    padding: '32px 24px', gap: '16px', textAlign: 'center',
                }}>
                    {[
                        { n: '500+', l: 'Active Items' },
                        { n: '200+', l: 'Sellers' },
                        { n: '2', l: 'Campuses' },
                        { n: '100%', l: 'Peer to Peer' },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: '2rem', fontWeight: 800,
                                color: '#ff6b2b', marginBottom: '4px',
                                letterSpacing: '-0.02em',
                            }}>
                                {s.n}
                            </div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {s.l}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Features Bento ── */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                        { icon: <ShieldCheck style={{ width: '22px', height: '22px', color: '#ff6b2b' }} />, title: 'Verified Students', desc: 'Every user is a real PESU student — safe, trusted peer-to-peer trading only.' },
                        { icon: <Zap style={{ width: '22px', height: '22px', color: '#f5c518' }} />, title: 'Instant Chat', desc: 'Message sellers directly, negotiate in seconds, and close the deal fast.' },
                        { icon: <Tag style={{ width: '22px', height: '22px', color: '#ff6b2b' }} />, title: 'Zero Fees', desc: 'No middlemen, no commissions, no platform cuts — 100% of the price goes to the seller.' },
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: '#242424',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px',
                                padding: '28px',
                            }}
                        >
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: 'rgba(255,107,43,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px',
                            }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{f.title}</h3>
                            <p style={{ fontFamily: "'Inter', sans-serif", color: '#555', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ background: '#242424', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ maxWidth: '520px', margin: '0 auto' }}
                >
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: '16px' }}>
                        Ready to dive in?
                    </h2>
                    <p style={{ fontFamily: "'Inter', sans-serif", color: '#555', marginBottom: '32px', fontSize: '1rem', margin: '0 0 32px' }}>
                        Join hundreds of students already trading on campus.
                    </p>
                    <Link href="/login" style={{ textDecoration: 'none' }}>
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 8px 36px rgba(255,107,43,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: '#ff6b2b', color: '#fff', border: 'none',
                                borderRadius: '999px', padding: '16px 48px',
                                fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', fontWeight: 800,
                                textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                                boxShadow: '0 4px 28px rgba(255,107,43,0.35)',
                            }}
                        >
                            Get Started →
                        </motion.button>
                    </Link>
                </motion.div>
            </section>

            <footer style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.65rem', color: '#333', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                    © 2026 MarketPlace — Built for PES University
                </p>
            </footer>
        </div>
    );
}
