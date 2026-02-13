import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { messageSchema } from '../utils/validators';

export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;

        const { data, error } = await supabaseAdmin
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

        res.json({ conversations: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
}

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
        const userId = req.user!.id;

        // Verify user is participant
        const { data: conv } = await supabaseAdmin
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .single();

        if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const { data, error } = await supabaseAdmin
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
        await supabaseAdmin
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);

        res.json({ messages: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
        const result = messageSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }

        const userId = req.user!.id;
        const { conversation_id, content } = result.data;

        // Verify user is participant
        const { data: conv } = await supabaseAdmin
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversation_id)
            .single();

        if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const { data, error } = await supabaseAdmin
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
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
}

export async function createConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { product_id } = req.body;
        const buyerId = req.user!.id;

        // Get product seller
        const { data: product } = await supabaseAdmin
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
        const { data: existing } = await supabaseAdmin
            .from('conversations')
            .select('*')
            .eq('product_id', product_id)
            .eq('buyer_id', buyerId)
            .single();

        if (existing) {
            res.json({ conversation: existing });
            return;
        }

        const { data, error } = await supabaseAdmin
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
    } catch (err) {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
}
