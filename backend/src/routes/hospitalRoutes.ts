import { Router } from 'express';
import { HospitalController } from '../controllers/HospitalController';

const router = Router();

router.get('/', HospitalController.getNearby);

export default router;
