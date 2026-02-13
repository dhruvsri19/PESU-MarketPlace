import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export async function getWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;

        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select(`
        *,
        product:products!product_id(
          *,
          seller:profiles!seller_id(id, full_name, avatar_url),
          category:categories!category_id(id, name, slug, icon)
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }

        res.json({ wishlist: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
}

export async function toggleWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;
        const { productId } = req.params;

        // Check if already in wishlist
        const { data: existing } = await supabaseAdmin
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            // Remove from wishlist
            await supabaseAdmin
                .from('wishlists')
                .delete()
                .eq('id', existing.id);

            res.json({ wishlisted: false, message: 'Removed from wishlist' });
        } else {
            // Add to wishlist
            await supabaseAdmin
                .from('wishlists')
                .insert({ user_id: userId, product_id: productId });

            res.json({ wishlisted: true, message: 'Added to wishlist' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle wishlist' });
    }
}

export async function checkWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.id;
        const { productId } = req.params;

        const { data } = await supabaseAdmin
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        res.json({ wishlisted: !!data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check wishlist' });
    }
}
