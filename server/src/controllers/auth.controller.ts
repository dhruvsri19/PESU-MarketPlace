import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { emailSchema, otpSchema, isValidCampusEmail } from '../utils/validators';

// Simple in-memory rate limiter for OTP sends (per email, 60s cooldown)
const otpCooldowns = new Map<string, number>();
const OTP_COOLDOWN_MS = 60_000; // 60 seconds

export async function sendOtp(req: Request, res: Response): Promise<void> {
    try {
        const result = emailSchema.safeParse(req.body.email);
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

        const { error } = await supabaseAdmin.auth.signInWithOtp({
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
    } catch (err) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
    try {
        const result = otpSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }

        const { email, token } = result.data;

        const { data, error } = await supabaseAdmin.auth.verifyOtp({
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
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        res.json({ profile: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { full_name, phone_number, phone, usn, is_onboarded, hostel, bio, avatar_url, campus, branch, semester } = req.body;

        const updatePayload: Record<string, any> = {};
        if (full_name !== undefined) updatePayload.full_name = full_name;
        if (phone_number !== undefined) updatePayload.phone_number = phone_number;
        else if (phone !== undefined) updatePayload.phone_number = phone; // Backward compatibility or just in case

        if (usn !== undefined) updatePayload.usn = usn;
        if (is_onboarded !== undefined) updatePayload.is_onboarded = is_onboarded;
        if (hostel !== undefined) updatePayload.hostel = hostel;
        if (bio !== undefined) updatePayload.bio = bio;
        if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;
        if (campus !== undefined) updatePayload.campus = campus;
        if (branch !== undefined) updatePayload.branch = branch;
        if (semester !== undefined) updatePayload.semester = semester;


        // Fetch fresh user to get email (needed for upsert when row doesn't exist yet)
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .upsert(
                { id: userId, email: authData?.user?.email ?? '', ...updatePayload },
                { onConflict: 'id' }
            )
            .select()
            .single();

        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }

        res.json({ profile: data });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        console.error('updateProfile error:', err);
        res.status(500).json({ error: message });
    }
}
