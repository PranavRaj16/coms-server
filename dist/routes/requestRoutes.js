import express from 'express';
import { submitQuoteRequest, getQuoteRequests, submitContactRequest, getContactRequests, getDashboardStats } from '../controllers/requestController.js';
const router = express.Router();
router.post('/quote', submitQuoteRequest);
router.get('/quote', getQuoteRequests);
router.post('/contact', submitContactRequest);
router.get('/contact', getContactRequests);
router.get('/stats', getDashboardStats);
export default router;
