import { z } from 'zod';
export declare const emailSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const otpSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    token: string;
}, {
    email: string;
    token: string;
}>;
export declare const productSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    category_id: z.ZodString;
    condition: z.ZodEnum<["new", "like_new", "good", "fair", "poor"]>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    price: number;
    category_id: string;
    condition: "new" | "like_new" | "good" | "fair" | "poor";
    description?: string | undefined;
    images?: string[] | undefined;
}, {
    title: string;
    price: number;
    category_id: string;
    condition: "new" | "like_new" | "good" | "fair" | "poor";
    description?: string | undefined;
    images?: string[] | undefined;
}>;
export declare const messageSchema: z.ZodObject<{
    conversation_id: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversation_id: string;
    content: string;
}, {
    conversation_id: string;
    content: string;
}>;
export declare function isValidCampusEmail(email: string): boolean;
//# sourceMappingURL=validators.d.ts.map