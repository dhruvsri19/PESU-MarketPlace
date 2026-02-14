import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getWishlist(req: AuthRequest, res: Response): Promise<void>;
export declare function toggleWishlist(req: AuthRequest, res: Response): Promise<void>;
export declare function checkWishlist(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=wishlist.controller.d.ts.map