'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/GlassButton';

export function LandingHero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8 }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-white selection:text-black overflow-x-hidden">
            {/* Hero Section - Minimalist */}
            <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl"
                >
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md mb-8"
                    >
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">Live at PES University</span>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-white"
                    >
                        TRADING <br />
                        <span className="text-zinc-600">REDEFINED.</span>
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl md:text-2xl text-zinc-500 max-w-2xl mb-12 leading-snug tracking-tight"
                    >
                        The exclusive ecosystem where PESU students buy, sell, and connect.
                        No noise. Just high-end commerce.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                        <Link href="/login">
                            <GlassButton
                                variant="primary"
                                size="lg"
                                className="h-16 px-10 text-base font-black tracking-widest rounded-2xl"
                            >
                                JOIN THE INNER CIRCLE
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </GlassButton>
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Bento Grid - The "Hand-crafted" Feel */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-full">
                    {/* Big Feature */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="md:col-span-2 md:row-span-2 p-12 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex flex-col justify-end min-h-[500px] relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck className="w-64 h-64 text-white -rotate-12 translate-x-12 -translate-y-12" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">VERIFIED ACCESS.</h3>
                            <p className="text-zinc-500 text-lg leading-relaxed max-w-md">
                                Every user is cross-checked with PES University credentials.
                                Secure, peer-to-peer trading you can actually trust.
                            </p>
                        </div>
                    </motion.div>

                    {/* Small Feature 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2 p-10 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-between group shadow-xl"
                    >
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">INSTANT CHAT.</h3>
                            <p className="text-zinc-500 text-sm">Direct, seamless communication with sellers.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                            <Zap className="w-8 h-8 text-violet-500" />
                        </div>
                    </motion.div>

                    {/* Small Feature 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-10 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex flex-col justify-between group shadow-xl"
                    >
                        <Users className="w-6 h-6 text-zinc-500 mb-6" />
                        <div>
                            <h3 className="text-lg font-black text-white mb-2 tracking-tighter">COMMUNITY DRIVEN.</h3>
                            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Built for students.</p>
                        </div>
                    </motion.div>

                    {/* Small Feature 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="p-10 rounded-[2rem] bg-white flex flex-col justify-between group shadow-xl"
                    >
                        <ShoppingBag className="w-6 h-6 text-black mb-6" />
                        <div>
                            <h3 className="text-lg font-black text-black mb-2 tracking-tighter">CURATED ITEMS.</h3>
                            <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Premium quality.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section className="py-48 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto"
                >
                    <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-12 uppercase leading-none">
                        READY TO <br />
                        <span className="text-zinc-700 font-bold">DIVE IN?</span>
                    </h2>
                    <Link href="/login">
                        <GlassButton
                            variant="primary"
                            size="lg"
                            className="h-20 px-16 text-xl rounded-2xl font-black bg-white text-black"
                        >
                            GET STARTED
                        </GlassButton>
                    </Link>
                </motion.div>
            </section>

            {/* Minimalist Footer */}
            <footer className="py-20 px-6 border-t border-zinc-900 text-center">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.5em]">
                    © 2026 PESU MarketPlace — Handcrafted for PES University.
                </p>
            </footer>
        </div>
    );
}
