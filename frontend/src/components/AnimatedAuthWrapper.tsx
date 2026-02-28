'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedAuthWrapperProps {
    children: ReactNode;
    isVisible: boolean;
}

export function AnimatedAuthWrapper({ children, isVisible }: AnimatedAuthWrapperProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="auth-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
                >
                    {/* Ambient background glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] blur-[140px] rounded-full opacity-10"
                            style={{ background: '#ff6b2b' }} />
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] blur-[100px] rounded-full opacity-8"
                            style={{ background: '#f5c518', mixBlendMode: 'screen' }} />
                        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] blur-[120px] rounded-full opacity-6"
                            style={{ background: '#ff6b2b', mixBlendMode: 'screen' }} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.4, ease: 'easeInOut' } }}
                        transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                        className="w-full max-w-md relative z-10"
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
