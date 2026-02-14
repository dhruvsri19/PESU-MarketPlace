"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSchema = exports.productSchema = exports.otpSchema = exports.emailSchema = void 0;
exports.isValidCampusEmail = isValidCampusEmail;
const zod_1 = require("zod");
const ALLOWED_DOMAIN = '@stu.pes.edu';
exports.emailSchema = zod_1.z
    .string()
    .email('Invalid email address')
    .refine((email) => email.toLowerCase().endsWith(ALLOWED_DOMAIN), { message: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
exports.otpSchema = zod_1.z.object({
    email: exports.emailSchema,
    token: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
exports.productSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(120),
    description: zod_1.z.string().max(2000).optional(),
    price: zod_1.z.number().min(0).max(999999),
    category_id: zod_1.z.string().uuid(),
    condition: zod_1.z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
    images: zod_1.z.array(zod_1.z.string().url()).max(5).optional(),
});
exports.messageSchema = zod_1.z.object({
    conversation_id: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1).max(1000),
});
function isValidCampusEmail(email) {
    return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}
//# sourceMappingURL=validators.js.map