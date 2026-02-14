import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getConversations(req: AuthRequest, res: Response): Promise<void>;
export declare function getMessages(req: AuthRequest, res: Response): Promise<void>;
export declare function sendMessage(req: AuthRequest, res: Response): Promise<void>;
export declare function createConversation(req: AuthRequest, res: Response): Promise<void>;
export declare function getUnreadCount(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=messages.controller.d.ts.map