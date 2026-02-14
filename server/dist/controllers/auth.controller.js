"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const supabase_1 = require("../config/supabase");
const validators_1 = require("../utils/validators");
// Simple in-memory rate limiter for OTP sends (per email, 60s cooldown)
const otpCooldowns = new Map();
const OTP_COOLDOWN_MS = 60_000; // 60 seconds
async function sendOtp(req, res) {
    try {
        const result = validators_1.emailSchema.safeParse(req.body.email);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }
        const email = result.data.toLowerCase();
        // Rate-limit: block repeated OTP sends within 60s
        const lastSent = otpCooldowns.get(email);
        if (lastSent && Date.now() - lastSent < OTP_COOLDOWN_MS) {
            const waitSec = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
            res.status(429).json({ error: `Please wait ${waitSec}s before requesting another OTP.` });
            return;
        }
        const { error } = await supabase_1.supabaseAdmin.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            },
        });
        // Track cooldown on success
        otpCooldowns.set(email, Date.now());
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json({ message: 'OTP sent successfully. Check your email.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
}
async function verifyOtp(req, res) {
    try {
        const result = validators_1.otpSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }
        const { email, token } = result.data;
        const { data, error } = await supabase_1.supabaseAdmin.auth.verifyOtp({
            email: email.toLowerCase(),
            token,
            type: 'email',
        });
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json({
            message: 'Verification successful',
            session: data.session,
            user: data.user,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
}
async function getProfile(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }
        res.json({ profile: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}
async function updateProfile(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { full_name, phone, hostel, bio, avatar_url, campus, branch, semester } = req.body;
        const updatePayload = {};
        if (full_name !== undefined)
            updatePayload.full_name = full_name;
        if (phone !== undefined)
            updatePayload.phone = phone;
        if (hostel !== undefined)
            updatePayload.hostel = hostel;
        if (bio !== undefined)
            updatePayload.bio = bio;
        if (avatar_url !== undefined)
            updatePayload.avatar_url = avatar_url;
        if (campus !== undefined)
            updatePayload.campus = campus;
        if (branch !== undefined)
            updatePayload.branch = branch;
        if (semester !== undefined)
            updatePayload.semester = semester;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json({ profile: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
}
//# sourceMappingURL=auth.controller.js.map