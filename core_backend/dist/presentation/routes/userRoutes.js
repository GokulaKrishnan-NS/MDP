"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const RateLimiter_1 = require("../middleware/RateLimiter");
const router = (0, express_1.Router)();
// Apply rate limiting: Max 10 requests per 1 minute for settings updates
router.put('/emergency-contact', (0, RateLimiter_1.rateLimiter)(10, 60000), UserController_1.UserController.updateEmergencyContact);
exports.default = router;
