import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getProducts(req: Request, res: Response): Promise<void>;
export declare function getProduct(req: Request, res: Response): Promise<void>;
export declare function createProduct(req: AuthRequest, res: Response): Promise<void>;
export declare function updateProduct(req: AuthRequest, res: Response): Promise<void>;
export declare function deleteProduct(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=products.controller.d.ts.map