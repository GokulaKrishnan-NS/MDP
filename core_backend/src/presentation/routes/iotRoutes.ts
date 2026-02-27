import { Router } from 'express';
import { IotController } from '../controllers/IotController';

const router = Router();

// Handle secure IoT device hardware dispense operations
router.post('/dispense', IotController.handleDeviceDispense);

export default router;
