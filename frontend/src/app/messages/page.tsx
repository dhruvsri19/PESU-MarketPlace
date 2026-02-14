'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { messagesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, MessageCircle, Sparkles, Package } from 'lucide-react';

/* ─────────────────────────── types ─────────────────────────── */
interface Profile {
    id: string;
    full_name: string;
    avatar_url: string | null;
}
interface ConversationProduct {
    id: string;
    title: string;
    images: string[];
    price: number;
}
interface Conversation {
    id: string;
    product_id: string;
    buyer_id: string;
    seller_id: string;
    last_message_at: string;
    product: ConversationProduct;
    buyer: Profile;
    seller: Profile;
    last_message?: { content: string; sender_id: string; created_at: string } | null;
    _lastMessage?: string;       // local UI cache (overrides last_message)
    _unread?: boolean;           // local UI cache
}
interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender: Profile;
}

/* ─────────────── helper: human-friendly timestamp ──────────── */
function chatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    if (diffH < 48) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function messageTime(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/* ═══════════════════════════ PAGE ═══════════════════════════ */
/* ══ Suspense wrapper (Next.js 16 requires it for useSearchParams) ══ */
export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
                    <p style={{ color: 'var(--text-muted)' }}>Loading messages…</p>
                </div>
            </div>
        }>
            <MessagesPageContent />
        </Suspense>
    );
}

function MessagesPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    /* ── state ── */
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeConv = conversations.find(c => c.id === activeConvId) ?? null;

    /* ── helper: who is the other person ── */
    const otherPerson = useCallback(
        (conv: Conversation) =>
            conv.buyer_id === user?.id ? conv.seller : conv.buyer,
        [user?.id],
    );

    /* ────────── 1. Load conversations ────────── */
    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }

        async function load() {
            try {
                const { data } = await messagesApi.getConversations();
                setConversations(data.conversations ?? []);
            } catch (err) {
                console.error('[Chat] Failed to load conversations:', err);
            } finally {
                setLoadingConvs(false);
            }
        }
        load();
    }, [user, authLoading, router]);

    /* ────────── 2. Open conversation from URL ────────── */
    useEffect(() => {
        const urlConvId = searchParams.get('conversation');
        if (urlConvId && conversations.length > 0) {
            setActiveConvId(urlConvId);
            setMobileShowChat(true);
        }
    }, [searchParams, conversations]);

    /* ────────── 3. Load messages when active conversation changes ──── */
    useEffect(() => {
        if (!activeConvId) return;
        let cancelled = false;

        async function loadMessages() {
            setLoadingMsgs(true);
            try {
                const { data } = await messagesApi.getMessages(activeConvId!);
                if (!cancelled) {
                    setMessages(data.messages ?? []);
                    // clear unread indicator
                    setConversations(prev =>
                        prev.map(c => c.id === activeConvId ? { ...c, _unread: false } : c),
                    );
                }
            } catch (err) {
                console.error('[Chat] Failed to load messages:', err);
            } finally {
                if (!cancelled) setLoadingMsgs(false);
            }
        }
        loadMessages();
        return () => { cancelled = true; };
    }, [activeConvId]);

    /* ────────── 4. Scroll to bottom on new messages ──────── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ────────── 5. Supabase Realtime subscription ──────── */
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('messages-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload: any) => {
                    const newMsg = payload.new as {
                        id: string;
                        conversation_id: string;
                        sender_id: string;
                        content: string;
                        is_read: boolean;
                        created_at: string;
                    };

                    // Only process messages belonging to our conversations
                    const isOurConv = conversations.some(c => c.id === newMsg.conversation_id);
                    if (!isOurConv) return;

                    // Update sidebar last_message_at + snippet
                    setConversations(prev => {
                        const updated = prev.map(c =>
                            c.id === newMsg.conversation_id
                                ? {
                                    ...c,
                                    last_message_at: newMsg.created_at,
                                    _lastMessage: newMsg.content,
                                    _unread: c.id !== activeConvId && newMsg.sender_id !== user.id,
                                }
                                : c,
                        );
                        // Re-sort by last_message_at
                        return updated.sort(
                            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
                        );
                    });

                    // Append to active chat
                    if (newMsg.conversation_id === activeConvId && newMsg.sender_id !== user.id) {
                        // Fetch full message with sender profile
                        try {
                            const { data } = await messagesApi.getMessages(activeConvId!);
                            setMessages(data.messages ?? []);
                        } catch {
                            // fallback: just append raw
                            setMessages(prev => [
                                ...prev,
                                {
                                    ...newMsg,
                                    sender: { id: newMsg.sender_id, full_name: '...', avatar_url: null },
                                } as Message,
                            ]);
                        }
                    }
                },
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, conversations, activeConvId]);

    /* ────────── 6. Send message ──────── */
    const handleSend = async () => {
        if (!draft.trim() || !activeConvId || sending) return;
        const content = draft.trim();
        setDraft('');
        setSending(true);

        // Optimistic: add message locally
        const optimistic: Message = {
            id: `opt-${Date.now()}`,
            conversation_id: activeConvId,
            sender_id: user!.id,
            content,
            is_read: false,
            created_at: new Date().toISOString(),
            sender: { id: user!.id, full_name: 'You', avatar_url: null },
        };
        setMessages(prev => [...prev, optimistic]);

        // Update sidebar snippet
        setConversations(prev => {
            const updated = prev.map(c =>
                c.id === activeConvId
                    ? { ...c, last_message_at: optimistic.created_at, _lastMessage: content }
                    : c,
            );
            return updated.sort(
                (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
            );
        });

        try {
            const { data } = await messagesApi.sendMessage({ conversation_id: activeConvId, content });
            // Replace optimistic with real message
            setMessages(prev =>
                prev.map(m => (m.id === optimistic.id ? data.message : m)),
            );
        } catch (err) {
            console.error('[Chat] Failed to send:', err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setDraft(content); // restore draft
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    /* ────────── 7. Select a conversation ──────── */
    const selectConversation = (convId: string) => {
        setActiveConvId(convId);
        setMobileShowChat(true);
        // Update URL without full navigation
        window.history.replaceState(null, '', `/messages?conversation=${convId}`);
    };

    const goBackToSidebar = () => {
        setMobileShowChat(false);
        setActiveConvId(null);
        window.history.replaceState(null, '', '/messages');
    };

    /* ───────────────── LOADING / AUTH GUARD ───────────────── */
    if (authLoading || loadingConvs) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
                    <p style={{ color: 'var(--text-muted)' }}>Loading conversations…</p>
                </div>
            </div>
        );
    }

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="h-[calc(100vh-64px)] flex" style={{ background: 'var(--bg-primary)' }}>

            {/* ═══════ SIDEBAR ═══════ */}
            <aside
                className={`
                    w-full md:w-[340px] lg:w-[380px] md:min-w-[340px]
                    flex flex-col border-r
                    ${mobileShowChat ? 'hidden md:flex' : 'flex'}
                `}
                style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary, rgba(255,255,255,0.02))' }}
            >
                {/* Sidebar header */}
                <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))' }}>
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Messages</h1>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
                                <Sparkles className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                No conversations yet
                            </h3>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Start a chat by clicking "Chat with Seller" on any product.
                            </p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const other = otherPerson(conv);
                            const isActive = conv.id === activeConvId;
                            const snippet = conv._lastMessage || conv.last_message?.content || '';
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => selectConversation(conv.id)}
                                    className={`
                                        w-full text-left p-4 flex gap-3 transition-all duration-150 border-l-2
                                        hover:bg-white/[0.04]
                                        ${isActive ? 'bg-white/[0.06] border-l-indigo-500' : 'border-l-transparent'}
                                    `}
                                    style={{ borderBottom: '1px solid var(--glass-border)' }}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {other.avatar_url ? (
                                            <img
                                                src={other.avatar_url}
                                                alt={other.full_name}
                                                className="w-11 h-11 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold"
                                                style={{ background: 'var(--gradient-primary)', color: 'white' }}
                                            >
                                                {other.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        {conv._unread && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2"
                                                style={{ borderColor: 'var(--bg-primary)' }} />
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                {other.full_name || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                                                {chatTime(conv.last_message_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <Package className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                                            <span className="text-[11px] truncate" style={{ color: 'var(--neon-purple)' }}>
                                                {conv.product?.title || 'Product'}
                                            </span>
                                        </div>
                                        {snippet && (
                                            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                                {snippet}
                                            </p>
                                        )}
                                    </div>

                                    {/* Product thumbnail */}
                                    {conv.product?.images?.[0] && (
                                        <img
                                            src={conv.product.images[0]}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 opacity-70"
                                        />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* ═══════ CHAT WINDOW ═══════ */}
            <main
                className={`
                    flex-1 flex flex-col min-w-0
                    ${!mobileShowChat ? 'hidden md:flex' : 'flex'}
                `}
            >
                {!activeConv ? (
                    /* ── Empty state ── */
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
                            <MessageCircle className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Select a conversation
                        </h2>
                        <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                            Choose a chat from the sidebar to start messaging. Your conversations are end-to-end within the campus.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Chat header ── */}
                        <div className="flex items-center gap-3 p-4 border-b glass-heavy"
                            style={{ borderColor: 'var(--glass-border)' }}>
                            {/* Mobile back */}
                            <button
                                onClick={goBackToSidebar}
                                className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            {/* Other person's avatar */}
                            {(() => {
                                const other = otherPerson(activeConv);
                                return other.avatar_url ? (
                                    <img src={other.avatar_url} alt={other.full_name}
                                        className="w-9 h-9 rounded-full object-cover" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                                        style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                        {other.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                );
                            })()}

                            <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {otherPerson(activeConv).full_name || 'Unknown'}
                                </h2>
                                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                    Re: {activeConv.product?.title} — ₹{activeConv.product?.price?.toLocaleString()}
                                </p>
                            </div>

                            {/* Product thumbnail */}
                            {activeConv.product?.images?.[0] && (
                                <img
                                    src={activeConv.product.images[0]}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => router.push(`/product/${activeConv.product.id}`)}
                                    title="View product"
                                />
                            )}
                        </div>

                        {/* ── Messages body ── */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {loadingMsgs ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        No messages yet
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Say hello to start the conversation!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Product reference card at top */}
                                    <div className="flex justify-center mb-4">
                                        <div
                                            className="glass-card inline-flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.06] transition-colors"
                                            onClick={() => router.push(`/product/${activeConv.product.id}`)}
                                        >
                                            {activeConv.product?.images?.[0] && (
                                                <img src={activeConv.product.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                            )}
                                            <div>
                                                <p className="text-xs font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                                                    {activeConv.product?.title}
                                                </p>
                                                <p className="text-[10px] neon-text">₹{activeConv.product?.price?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {messages.map((msg, idx) => {
                                        const isMine = msg.sender_id === user!.id;
                                        const prevMsg = messages[idx - 1];
                                        const showTimeSep = !prevMsg ||
                                            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 600_000; // 10 min gap

                                        return (
                                            <div key={msg.id}>
                                                {showTimeSep && (
                                                    <div className="flex justify-center my-3">
                                                        <span className="text-[10px] px-3 py-1 rounded-full glass"
                                                            style={{ color: 'var(--text-muted)' }}>
                                                            {messageTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                                                    <div
                                                        className={`max-w-[75%] sm:max-w-[60%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${isMine
                                                            ? 'rounded-br-md'
                                                            : 'rounded-bl-md'
                                                            }`}
                                                        style={
                                                            isMine
                                                                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                                                                : { background: 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }
                                                        }
                                                    >
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* ── Message input ── */}
                        <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    placeholder="Type a message…"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200
                                        focus:ring-2 focus:ring-indigo-500/40"
                                    style={{
                                        background: 'var(--glass-bg)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--glass-border)',
                                    }}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    disabled={!draft.trim() || sending}
                                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                                    style={{
                                        background: draft.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--glass-bg)',
                                        color: 'white',
                                    }}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
