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
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    // Track whether we've already fetched the profile for this user
    const profileFetchedForRef = useRef<string | null>(null);

    const fetchProfile = useCallback(async (userId: string, force = false) => {
        if (!force && profileFetchedForRef.current === userId && profile) return;

        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            setProfile(data);
            profileFetchedForRef.current = userId;
        } catch {
            // Silent fail — profile will be null
        }
    }, [profile]);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, true).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
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
                    setLoading(false);
                    router.refresh();
                } else if (event === 'TOKEN_REFRESHED') {
                    // Token refresh is routine — no router.refresh(), no profile re-fetch
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
        <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
