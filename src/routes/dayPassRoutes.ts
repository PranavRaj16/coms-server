import express, { Router } from 'express';
import { requestDayPass, getAllDayPasses, verifyDayPass } from '../controllers/dayPassController.js';
import { protect, admin, authorize } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.post('/', requestDayPass);
router.get('/', protect, authorize('Admin', 'Authenticator'), getAllDayPasses);
router.get('/verify/:passCode', protect, authorize('Admin', 'Authenticator'), verifyDayPass);

export default router;
