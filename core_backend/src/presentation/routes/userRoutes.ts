import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { rateLimiter } from '../middleware/RateLimiter';

const router = Router();

// Apply rate limiting: Max 10 requests per 1 minute for settings updates
router.put(
    '/emergency-contact',
    rateLimiter(10, 60000),
    UserController.updateEmergencyContact
);

export default router;
