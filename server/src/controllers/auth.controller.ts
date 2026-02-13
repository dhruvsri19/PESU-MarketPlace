import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { emailSchema, otpSchema, isValidCampusEmail } from '../utils/validators';

export async function sendOtp(req: Request, res: Response): Promise<void> {
    try {
        const result = emailSchema.safeParse(req.body.email);
        if (!result.success) {
            res.status(400).json({ error: result.error.errors[0].message });
            return;
        }

        const email = result.data.toLowerCase();

        const { error } = await supabaseAdmin.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            },
        });

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

        const { full_name, phone, hostel, bio, avatar_url, campus, branch } = req.body;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ full_name, phone, hostel, bio, avatar_url, campus, branch })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }

        res.json({ profile: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
}
