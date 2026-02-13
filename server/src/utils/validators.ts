import { z } from 'zod';

const ALLOWED_DOMAIN = '@stu.pes.edu';

export const emailSchema = z
    .string()
    .email('Invalid email address')
    .refine(
        (email) => email.toLowerCase().endsWith(ALLOWED_DOMAIN),
        { message: `Only ${ALLOWED_DOMAIN} email addresses are allowed` }
    );

export const otpSchema = z.object({
    email: emailSchema,
    token: z.string().length(6, 'OTP must be 6 digits'),
});

export const productSchema = z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(2000).optional(),
    price: z.number().min(0).max(999999),
    category_id: z.string().uuid(),
    condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
    images: z.array(z.string().url()).max(5).optional(),
});

export const messageSchema = z.object({
    conversation_id: z.string().uuid(),
    content: z.string().min(1).max(1000),
});

export function isValidCampusEmail(email: string): boolean {
    return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}
