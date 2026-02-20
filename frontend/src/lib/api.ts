import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach auth token to requests
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// API functions
export const authApi = {
    sendOtp: (email: string) => api.post('/auth/otp/send', { email }),
    verifyOtp: (email: string, token: string) => api.post('/auth/otp/verify', { email, token }),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data: {
        full_name?: string;
        phone_number?: string;
        usn?: string;
        branch?: string;
        semester?: number;
        is_onboarded?: boolean;
        [key: string]: any;
    }) => api.put('/auth/profile', data),

};

export const productsApi = {
    getAll: (params?: Record<string, string>) => api.get('/products', { params }),
    getOne: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
};

export const messagesApi = {
    getConversations: () => api.get('/messages/conversations'),
    getMessages: (conversationId: string) => api.get(`/messages/${conversationId}`),
    sendMessage: (data: { conversation_id: string; content: string }) => api.post('/messages', data),
    createConversation: (productId: string) => api.post('/messages/conversations', { product_id: productId }),
    getUnreadCount: () => api.get('/messages/unread-count'),
};

export const wishlistApi = {
    getAll: () => api.get('/wishlist'),
    toggle: (productId: string) => api.post(`/wishlist/${productId}`),
    check: (productId: string) => api.get(`/wishlist/${productId}/check`),
};

export default api;
