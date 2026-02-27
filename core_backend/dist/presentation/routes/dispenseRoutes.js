"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DispenseController_1 = require("../controllers/DispenseController");
const RateLimiter_1 = require("../middleware/RateLimiter");
const router = (0, express_1.Router)();
// Apply rate limiting: Max 3 requests per 1 minute (60000 ms) window per IP
router.post('/dispense', (0, RateLimiter_1.rateLimiter)(3, 60000), DispenseController_1.DispenseController.executeDispense);
exports.default = router;
