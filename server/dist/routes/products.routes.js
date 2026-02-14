"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("../controllers/products.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', products_controller_1.getProducts);
router.get('/:id', products_controller_1.getProduct);
// Protected routes
router.post('/', auth_1.authMiddleware, products_controller_1.createProduct);
router.put('/:id', auth_1.authMiddleware, products_controller_1.updateProduct);
router.delete('/:id', auth_1.authMiddleware, products_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=products.routes.js.map