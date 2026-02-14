"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/otp/send', auth_controller_1.sendOtp);
router.post('/otp/verify', auth_controller_1.verifyOtp);
// Protected routes
router.get('/profile', auth_1.authMiddleware, auth_controller_1.getProfile);
router.put('/profile', auth_1.authMiddleware, auth_controller_1.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map