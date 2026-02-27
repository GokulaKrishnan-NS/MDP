import { Router } from 'express';
import { DispenseController } from '../controllers/DispenseController';
import { rateLimiter } from '../middleware/RateLimiter';

const router = Router();

// Apply rate limiting: Max 3 requests per 1 minute (60000 ms) window per IP
router.post(
    '/dispense',
    rateLimiter(3, 60000),
    DispenseController.executeDispense
);

export default router;
