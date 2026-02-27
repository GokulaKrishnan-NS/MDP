import { Router } from 'express';
import { EmergencyController } from '../controllers/EmergencyController';
import { LocationController } from '../controllers/LocationController';

const router = Router();

// Retrieve nearby hospitals
router.get('/nearby-hospitals', EmergencyController.getNearbyHospitals);

// Sync current tracker location to server
router.post('/location', LocationController.syncLocation);

export default router;
