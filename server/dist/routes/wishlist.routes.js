"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All wishlist routes are protected
router.use(auth_1.authMiddleware);
router.get('/', wishlist_controller_1.getWishlist);
router.post('/:productId', wishlist_controller_1.toggleWishlist);
router.get('/:productId/check', wishlist_controller_1.checkWishlist);
exports.default = router;
//# sourceMappingURL=wishlist.routes.js.map