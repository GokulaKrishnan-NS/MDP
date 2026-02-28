import { Router } from 'express';
import { DispenseController } from '../controllers/DispenseController';

const router = Router();

router.post('/', DispenseController.dispense);

export default router;
