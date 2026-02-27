import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController';

const router = Router();

// Get the daily schedules for the authenticated user
router.get('/', ScheduleController.getDailySchedules);

export default router;
