import express, { Router } from 'express';
import {
    submitQuoteRequest,
    getQuoteRequests,
    submitContactRequest,
    getContactRequests,
    getDashboardStats
} from '../controllers/requestController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.post('/quote', submitQuoteRequest);
router.get('/quote', protect, admin, getQuoteRequests);

router.post('/contact', submitContactRequest);
router.get('/contact', protect, admin, getContactRequests);

router.get('/stats', protect, admin, getDashboardStats);

export default router;
