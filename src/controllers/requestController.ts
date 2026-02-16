import { Request, Response } from 'express';
import QuoteRequest from '../models/QuoteRequest.js';
import ContactRequest from '../models/ContactRequest.js';
import User from '../models/User.js';

// --- Quote Requests ---

// @desc    Submit a quote request
// @route   POST /api/requests/quote
// @access  Public
export const submitQuoteRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const quoteRequest = new QuoteRequest(req.body);
        const createdRequest = await quoteRequest.save();
        res.status(201).json(createdRequest);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all quote requests
// @route   GET /api/requests/quote
// @access  Private/Admin
export const getQuoteRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const requests = await QuoteRequest.find({}).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Contact Requests ---

// @desc    Submit a contact request
// @route   POST /api/requests/contact
// @access  Public
export const submitContactRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const contactRequest = new ContactRequest(req.body);
        const createdRequest = await contactRequest.save();
        res.status(201).json(createdRequest);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all contact requests
// @route   GET /api/requests/contact
// @access  Private/Admin
export const getContactRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const requests = await ContactRequest.find({}).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Dashboard Stats ---

// @desc    Get dashboard stats
// @route   GET /api/requests/stats
// @access  Private/Admin
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments();
        const activeMembers = await User.countDocuments({ status: 'Active' });
        const newQuoteRequests = await QuoteRequest.countDocuments({ status: 'Pending' });

        // Mock revenue growth for now as requested in stats grid
        const revenueGrowth = "+12.5%";

        res.json({
            totalUsers,
            activeMembers,
            newQuoteRequests,
            revenueGrowth
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
