import { Router } from 'express';
import { MedicineController } from '../controllers/MedicineController';

const router = Router();

// Create a new medicine
router.post('/', MedicineController.createMedicine);

export default router;
