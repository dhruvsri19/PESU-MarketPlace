"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.createConversation = createConversation;
exports.getUnreadCount = getUnreadCount;
const supabase_1 = require("../config/supabase");
const validators_1 = require("../utils/validators");
async function getConversations(req, res) {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select(`
        *,
        product:products!product_id(id, title, images, price),
        buyer:profiles!buyer_id(id, full_name, avatar_url),
        seller:profiles!seller_id(id, full_name, avatar_url)
      `)
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        // Fetch the latest message for each conversation
        const convIds = (data || []).map((c) => c.id);
        let lastMessages = {};
        if (convIds.length > 0) {
            const { data: msgs } = await supabase_1.supabaseAdmin
                .from('messages')
                .select('conversation_id, content, sender_id, created_at')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });
            // Pick the first (latest) message per conversation
            if (msgs) {
                for (const msg of msgs) {
                    if (!lastMessages[msg.conversation_id]) {
                        lastMessages[msg.conversation_id] = msg;
                    }
                }
            }
        }
        // Attach last_message to each conversation
        const enriched = (data || []).map((conv) => ({
            ...conv,
            last_message: lastMessages[conv.id] || null,
        }));
        res.json({ conversations: enriched });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
}
async function getMessages(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        // Verify user is participant
        const { data: conv } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .single();
        if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('messages')
            .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url)
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        // Mark messages as read
        await supabase_1.supabaseAdmin
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);
        res.json({ messages: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}
async function sendMessage(req, res) {
    try {
        const result = validators_1.messageSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }
        const userId = req.user.id;
        const { conversation_id, content } = result.data;
        // Verify user is participant
        const { data: conv } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversation_id)
            .single();
        if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('messages')
            .insert({
            conversation_id,
            sender_id: userId,
            content,
        })
            .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url)
      `)
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({ message: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
}
async function createConversation(req, res) {
    try {
        const { product_id } = req.body;
        const buyerId = req.user.id;
        // Get product seller
        const { data: product } = await supabase_1.supabaseAdmin
            .from('products')
            .select('seller_id')
            .eq('id', product_id)
            .single();
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        if (product.seller_id === buyerId) {
            res.status(400).json({ error: 'Cannot message yourself' });
            return;
        }
        // Check if conversation already exists
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('*')
            .eq('product_id', product_id)
            .eq('buyer_id', buyerId)
            .single();
        if (existing) {
            res.json({ conversation: existing });
            return;
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('conversations')
            .insert({
            product_id,
            buyer_id: buyerId,
            seller_id: product.seller_id,
        })
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({ conversation: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
}
async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;
        // Get all conversation IDs where user is a participant
        const { data: convs } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('id')
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
        if (!convs || convs.length === 0) {
            res.json({ unread_count: 0 });
            return;
        }
        const convIds = convs.map((c) => c.id);
        // Count unread messages NOT sent by the current user
        const { data: unreadMsgs } = await supabase_1.supabaseAdmin
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', convIds)
            .eq('is_read', false)
            .neq('sender_id', userId);
        // Count distinct conversations with unread messages
        const uniqueConvIds = new Set((unreadMsgs || []).map((m) => m.conversation_id));
        res.json({ unread_count: uniqueConvIds.size });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to get unread count' });
    }
}
//# sourceMappingURL=messages.controller.js.map