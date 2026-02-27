import { supabase } from './supabase';

// ─── Helper: get current user, throw if not logged in ──────────────
async function requireUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    return user;
}

// ─── Auth / Profile ────────────────────────────────────────────────
export const authApi = {
    sendOtp: async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
        });
        if (error) throw error;
        return { data: { message: 'OTP sent successfully. Check your email.' } };
    },

    verifyOtp: async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email: email.toLowerCase(),
            token,
            type: 'email',
        });
        if (error) throw error;
        return { data: { message: 'Verification successful', session: data.session, user: data.user } };
    },

    getProfile: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (error) throw error;
        return { data: { profile: data } };
    },

    updateProfile: async (payload: {
        full_name?: string;
        phone_number?: string;
        branch?: string;
        semester?: number;
        is_onboarded?: boolean;
        [key: string]: any;
    }) => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('profiles')
            .upsert(
                { id: user.id, email: user.email ?? '', ...payload },
                { onConflict: 'id' }
            )
            .select()
            .single();
        if (error) throw error;
        return { data: { profile: data } };
    },
};

// ─── Products ──────────────────────────────────────────────────────
export const productsApi = {
    getAll: async (params?: Record<string, string>) => {
        const {
            category,
            min_price,
            max_price,
            condition,
            sort = 'newest',
            search,
            page = '1',
            limit = '20',
        } = params || {};

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('products')
            .select(`
                *,
                seller:profiles!seller_id(id, full_name, avatar_url),
                category:categories!category_id(id, name, slug, icon)
            `, { count: 'exact' })
            .eq('status', 'active');

        if (category) query = query.eq('category_id', category);
        if (min_price) query = query.gte('price', parseFloat(min_price));
        if (max_price) query = query.lte('price', parseFloat(max_price));
        if (condition) query = query.eq('condition', condition);
        if (search) query = query.ilike('title', `%${search}%`);

        switch (sort) {
            case 'price_low': query = query.order('price', { ascending: true }); break;
            case 'price_high': query = query.order('price', { ascending: false }); break;
            case 'trending': query = query.order('views_count', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false }); break;
        }

        query = query.range(offset, offset + limitNum - 1);
        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: {
                products: data,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limitNum),
                },
            },
        };
    },

    getOne: async (id: string) => {
        // Best-effort view increment
        try { await supabase.rpc('increment_views', { product_id: id }); } catch (_) { }

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                seller:profiles!seller_id(id, full_name, avatar_url, hostel, created_at),
                category:categories!category_id(id, name, slug, icon)
            `)
            .eq('id', id)
            .neq('status', 'deleted')
            .single();
        if (error) throw error;
        return { data: { product: data } };
    },

    create: async (payload: any, _signal?: AbortSignal) => {
        const user = await requireUser();

        // Ensure profile exists (FK constraint)
        const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!profileRow) {
            const { error: upsertErr } = await supabase
                .from('profiles')
                .upsert(
                    { id: user.id, email: user.email ?? '', full_name: '' },
                    { onConflict: 'id' }
                );
            if (upsertErr) throw new Error(`Profile setup failed: ${upsertErr.message}`);
        }

        const { data, error } = await supabase
            .from('products')
            .insert({ ...payload, seller_id: user.id })
            .select(`
                *,
                seller:profiles!seller_id(id, full_name, avatar_url),
                category:categories!category_id(id, name, slug, icon)
            `)
            .single();
        if (error) throw error;
        return { data: { product: data } };
    },

    update: async (id: string, payload: any) => {
        const user = await requireUser();

        // Ownership check
        const { data: existing } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();
        if (!existing || existing.seller_id !== user.id) throw new Error('Not authorized');

        // Whitelist fields
        const allowed: Record<string, any> = {};
        const { title, description, price, category_id, condition, images, status } = payload;
        if (title !== undefined) allowed.title = String(title).trim();
        if (description !== undefined) allowed.description = String(description).trim();
        if (price !== undefined) {
            const clean = Number(String(price).replace(/[^0-9.-]+/g, ''));
            if (isNaN(clean) || clean < 0) throw new Error('Invalid price');
            allowed.price = clean;
        }
        if (category_id !== undefined) allowed.category_id = category_id;
        if (condition !== undefined) allowed.condition = condition;
        if (images !== undefined) allowed.images = images;
        if (status !== undefined) allowed.status = status;

        if (Object.keys(allowed).length === 0) throw new Error('No valid fields');

        const { data, error } = await supabase
            .from('products')
            .update(allowed)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return { data: { product: data } };
    },

    delete: async (id: string) => {
        const user = await requireUser();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('seller_id', user.id);
        if (error) throw error;
        return { data: { message: 'Product deleted' } };
    },
};

// ─── Messages / Conversations ──────────────────────────────────────
export const messagesApi = {
    getConversations: async () => {
        const user = await requireUser();

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                product:products!product_id(id, title, images, price),
                buyer:profiles!buyer_id(id, full_name, avatar_url),
                seller:profiles!seller_id(id, full_name, avatar_url)
            `)
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false });
        if (error) throw error;

        // Fetch last message per conversation
        const convIds = (data || []).map((c: any) => c.id);
        let lastMessages: Record<string, any> = {};
        if (convIds.length > 0) {
            const { data: msgs } = await supabase
                .from('messages')
                .select('conversation_id, content, sender_id, created_at')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });
            if (msgs) {
                for (const msg of msgs) {
                    if (!lastMessages[msg.conversation_id]) lastMessages[msg.conversation_id] = msg;
                }
            }
        }

        const enriched = (data || []).map((conv: any) => ({
            ...conv,
            last_message: lastMessages[conv.id] || null,
        }));

        return { data: { conversations: enriched } };
    },

    getMessages: async (conversationId: string) => {
        const user = await requireUser();

        // Verify participant
        const { data: conv } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .single();
        if (!conv || (conv.buyer_id !== user.id && conv.seller_id !== user.id)) {
            throw new Error('Not authorized');
        }

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) throw error;

        // Mark as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id);

        return { data: { messages: data } };
    },

    sendMessage: async (payload: { conversation_id: string; content: string }) => {
        const user = await requireUser();

        const { data: conv } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', payload.conversation_id)
            .single();
        if (!conv || (conv.buyer_id !== user.id && conv.seller_id !== user.id)) {
            throw new Error('Not authorized');
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: payload.conversation_id,
                sender_id: user.id,
                content: payload.content,
            })
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .single();
        if (error) throw error;
        return { data: { message: data } };
    },

    createConversation: async (productId: string) => {
        const user = await requireUser();

        const { data: product } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', productId)
            .single();
        if (!product) throw new Error('Product not found');
        if (product.seller_id === user.id) throw new Error('Cannot message yourself');

        // Check existing
        const { data: existing } = await supabase
            .from('conversations')
            .select('*')
            .eq('product_id', productId)
            .eq('buyer_id', user.id)
            .single();
        if (existing) return { data: { conversation: existing } };

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                product_id: productId,
                buyer_id: user.id,
                seller_id: product.seller_id,
            })
            .select()
            .single();
        if (error) throw error;
        return { data: { conversation: data } };
    },

    getUnreadCount: async () => {
        const user = await requireUser();

        const { data: convs } = await supabase
            .from('conversations')
            .select('id')
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        if (!convs || convs.length === 0) return { data: { unread_count: 0 } };

        const convIds = convs.map((c: any) => c.id);
        const { data: unreadMsgs } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', convIds)
            .eq('is_read', false)
            .neq('sender_id', user.id);

        const uniqueConvIds = new Set((unreadMsgs || []).map((m: any) => m.conversation_id));
        return { data: { unread_count: uniqueConvIds.size } };
    },
};

// ─── Wishlist ──────────────────────────────────────────────────────
export const wishlistApi = {
    getAll: async () => {
        const user = await requireUser();
        const { data, error } = await supabase
            .from('wishlists')
            .select(`
                *,
                product:products!product_id(
                    *,
                    seller:profiles!seller_id(id, full_name, avatar_url),
                    category:categories!category_id(id, name, slug, icon)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data: { wishlist: data } };
    },

    toggle: async (productId: string) => {
        const user = await requireUser();

        const { data: existing } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            await supabase.from('wishlists').delete().eq('id', existing.id);
            return { data: { wishlisted: false, message: 'Removed from wishlist' } };
        } else {
            await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
            return { data: { wishlisted: true, message: 'Added to wishlist' } };
        }
    },

    check: async (productId: string) => {
        const user = await requireUser();
        const { data } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();
        return { data: { wishlisted: !!data } };
    },
};
