import { Router } from 'express';
import { TrayController } from '../controllers/TrayController';

const router = Router();

router.get('/', TrayController.getAll);
router.post('/', TrayController.addTray);
router.post('/init', TrayController.initTrays);
router.delete('/:trayId', TrayController.deleteTray);

export default router;
