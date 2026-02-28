'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: any | null;
    loading: boolean;
    isNewUser: boolean;
    setIsNewUser: (v: boolean) => void;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isNewUser: false,
    setIsNewUser: () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);

    // Track whether we've already fetched the profile for this user
    const profileFetchedForRef = useRef<string | null>(null);

    const fetchProfile = useCallback(async (userId: string, force = false) => {
        if (!force && profileFetchedForRef.current === userId && profile) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            console.log('[AuthContext] Profile query for', userId, '→', data, 'error:', error);

            if (error || !data) {
                // No profile row at all → new user
                console.log('[AuthContext] No profile found → isNewUser = true');
                setProfile(null);
                setIsNewUser(true);
                return;
            }

            setProfile({ ...data, id: userId });
            profileFetchedForRef.current = userId;

            // Detect new user: no profile row or empty full_name
            const isNew = !data.full_name || !data.campus;
            console.log('[AuthContext] full_name:', data.full_name, 'campus:', data.campus, '→ isNewUser:', isNew);
            setIsNewUser(isNew);
        } catch (err) {
            console.error('[AuthContext] fetchProfile exception:', err);
            setIsNewUser(true);
        }
    }, [profile]);

    useEffect(() => {
        // Get initial session — no aggressive refresh
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id, true);
                }
            } catch (err) {
                console.error('[AuthContext] Session init error:', err);
            }
            setLoading(false);
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[AuthContext] onAuthStateChange:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (event === 'SIGNED_IN') {
                    if (session?.user) {
                        await fetchProfile(session.user.id, true);
                    }
                    setLoading(false);
                    router.refresh();
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    profileFetchedForRef.current = null;
                    setIsNewUser(false);
                    setLoading(false);
                    router.refresh();
                } else if (event === 'TOKEN_REFRESHED') {
                    setLoading(false);
                } else if (event === 'USER_UPDATED') {
                    if (session?.user) {
                        await fetchProfile(session.user.id, true);
                    }
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        profileFetchedForRef.current = null;
        router.push('/');
        router.refresh();
    }, [router]);

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id, true);
    }, [user, fetchProfile]);

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, isNewUser, setIsNewUser, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
