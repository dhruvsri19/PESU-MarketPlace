"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWishlist = getWishlist;
exports.toggleWishlist = toggleWishlist;
exports.checkWishlist = checkWishlist;
const supabase_1 = require("../config/supabase");
async function getWishlist(req, res) {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase_1.supabaseAdmin
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
}
async function toggleWishlist(req, res) {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        // Check if already in wishlist
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        if (existing) {
            // Remove from wishlist
            await supabase_1.supabaseAdmin
                .from('wishlists')
                .delete()
                .eq('id', existing.id);
            res.json({ wishlisted: false, message: 'Removed from wishlist' });
        }
        else {
            // Add to wishlist
            await supabase_1.supabaseAdmin
                .from('wishlists')
                .insert({ user_id: userId, product_id: productId });
            res.json({ wishlisted: true, message: 'Added to wishlist' });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to toggle wishlist' });
    }
}
async function checkWishlist(req, res) {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { data } = await supabase_1.supabaseAdmin
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        res.json({ wishlisted: !!data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check wishlist' });
    }
}
//# sourceMappingURL=wishlist.controller.js.map