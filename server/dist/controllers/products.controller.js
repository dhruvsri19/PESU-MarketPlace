"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProduct = getProduct;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const supabase_1 = require("../config/supabase");
const validators_1 = require("../utils/validators");
async function getProducts(req, res) {
    try {
        const { category, min_price, max_price, condition, sort = 'newest', search, page = '1', limit = '20', } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const offset = (pageNum - 1) * limitNum;
        let query = supabase_1.supabaseAdmin
            .from('products')
            .select(`
        *,
        seller:profiles!seller_id(id, full_name, avatar_url),
        category:categories!category_id(id, name, slug, icon)
      `, { count: 'exact' })
            .eq('status', 'active');
        if (category) {
            query = query.eq('category_id', category);
        }
        if (min_price) {
            query = query.gte('price', parseFloat(min_price));
        }
        if (max_price) {
            query = query.lte('price', parseFloat(max_price));
        }
        if (condition) {
            query = query.eq('condition', condition);
        }
        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        // Sorting
        switch (sort) {
            case 'price_low':
                query = query.order('price', { ascending: true });
                break;
            case 'price_high':
                query = query.order('price', { ascending: false });
                break;
            case 'trending':
                query = query.order('views_count', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }
        query = query.range(offset, offset + limitNum - 1);
        const { data, error, count } = await query;
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json({
            products: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limitNum),
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}
async function getProduct(req, res) {
    try {
        const { id } = req.params;
        // Increment views (best-effort, don't block on failure)
        try {
            await supabase_1.supabaseAdmin.rpc('increment_views', { product_id: id });
        }
        catch (_) { }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('products')
            .select(`
        *,
        seller:profiles!seller_id(id, full_name, avatar_url, hostel, created_at),
        category:categories!category_id(id, name, slug, icon)
      `)
            .eq('id', id)
            .neq('status', 'deleted')
            .single();
        if (error) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json({ product: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
}
async function createProduct(req, res) {
    try {
        const result = validators_1.productSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('products')
            .insert({
            ...result.data,
            seller_id: req.user.id,
        })
            .select(`
        *,
        seller:profiles!seller_id(id, full_name, avatar_url),
        category:categories!category_id(id, name, slug, icon)
      `)
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({ product: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
}
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Product ID is required' });
            return;
        }
        console.log('[updateProduct] ID:', id, 'Body keys:', Object.keys(req.body));
        // Check ownership
        const { data: existing, error: fetchError } = await supabase_1.supabaseAdmin
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();
        if (fetchError) {
            console.error('[updateProduct] Fetch error:', fetchError);
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        if (!existing || existing.seller_id !== req.user.id) {
            res.status(403).json({ error: 'Not authorized to update this product' });
            return;
        }
        // Whitelist only valid product columns — never pass raw req.body
        const allowedFields = {};
        const { title, description, price, category_id, condition, images, status } = req.body;
        if (title !== undefined)
            allowedFields.title = String(title).trim();
        if (description !== undefined)
            allowedFields.description = String(description).trim();
        if (price !== undefined) {
            // Sanitize price: strip any currency symbols, ensure it's a valid number
            const cleanPrice = Number(String(price).replace(/[^0-9.-]+/g, ''));
            if (isNaN(cleanPrice) || cleanPrice < 0) {
                res.status(400).json({ error: 'Invalid price value' });
                return;
            }
            allowedFields.price = cleanPrice;
        }
        if (category_id !== undefined)
            allowedFields.category_id = category_id;
        if (condition !== undefined)
            allowedFields.condition = condition;
        if (images !== undefined)
            allowedFields.images = images;
        if (status !== undefined)
            allowedFields.status = status;
        if (Object.keys(allowedFields).length === 0) {
            res.status(400).json({ error: 'No valid fields to update' });
            return;
        }
        console.log('[updateProduct] Updating with:', allowedFields);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('products')
            .update(allowedFields)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('[updateProduct] Supabase error:', error);
            res.status(400).json({ error: error.message });
            return;
        }
        console.log('[updateProduct] Success:', data?.id);
        res.json({ product: data });
    }
    catch (err) {
        console.error('[updateProduct] FULL SERVER ERROR:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
}
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabaseAdmin
            .from('products')
            .update({ status: 'deleted' })
            .eq('id', id)
            .eq('seller_id', req.user.id);
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json({ message: 'Product deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
}
//# sourceMappingURL=products.controller.js.map