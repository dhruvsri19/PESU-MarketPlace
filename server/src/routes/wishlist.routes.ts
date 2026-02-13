import { Router } from 'express';
import { getWishlist, toggleWishlist, checkWishlist } from '../controllers/wishlist.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All wishlist routes are protected
router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/:productId', toggleWishlist);
router.get('/:productId/check', checkWishlist);

export default router;
