import express, { Router } from 'express';
import {
    submitQuoteRequest,
    getQuoteRequests,
    submitContactRequest,
    getContactRequests,
    getDashboardStats,
    updateQuoteRequest,
    updateContactRequest,
    submitBookingRequest,
    getBookingRequests,
    updateBookingRequest,
    submitVisitRequest,
    getVisitRequests,
    updateVisitRequest
} from '../controllers/requestController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.post('/quote', submitQuoteRequest);
router.get('/quote', protect, getQuoteRequests);
router.put('/quote/:id', protect, admin, updateQuoteRequest);

router.post('/contact', submitContactRequest);
router.get('/contact', protect, admin, getContactRequests);
router.put('/contact/:id', protect, admin, updateContactRequest);

router.post('/booking', submitBookingRequest);
router.get('/booking', protect, getBookingRequests);
router.put('/booking/:id', protect, admin, updateBookingRequest);

router.post('/visit', submitVisitRequest);
router.get('/visit', protect, admin, getVisitRequests);
router.put('/visit/:id', protect, admin, updateVisitRequest);

router.get('/stats', protect, admin, getDashboardStats);

export default router;
