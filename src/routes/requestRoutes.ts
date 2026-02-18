import express, { Router } from 'express';
import {
    submitQuoteRequest,
    getQuoteRequests,
    submitContactRequest,
    getContactRequests,
    getDashboardStats,
    updateQuoteRequest,
    updateContactRequest
} from '../controllers/requestController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.post('/quote', submitQuoteRequest);
router.get('/quote', protect, getQuoteRequests);
router.put('/quote/:id', protect, admin, updateQuoteRequest);

router.post('/contact', submitContactRequest);
router.get('/contact', protect, admin, getContactRequests);
router.put('/contact/:id', protect, admin, updateContactRequest);

router.get('/stats', protect, admin, getDashboardStats);

export default router;
