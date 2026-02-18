import { Request, Response } from 'express';
import mongoose from 'mongoose';
import QuoteRequest from '../models/QuoteRequest.js';
import ContactRequest from '../models/ContactRequest.js';
import BookingRequest from '../models/BookingRequest.js';
import VisitRequest from '../models/VisitRequest.js';
import User from '../models/User.js';
import { validateEmail, checkRequiredFields, validateMobile } from '../utils/validation.js';

// --- Quote Requests ---

// @desc    Submit a quote request
// @route   POST /api/requests/quote
// @access  Public
export const submitQuoteRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const requiredError = checkRequiredFields(req.body, ['fullName', 'workEmail', 'requiredWorkspace', 'firmName', 'contactNumber']);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        if (!validateEmail(req.body.workEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (req.body.contactNumber && !validateMobile(req.body.contactNumber)) {
            return res.status(400).json({ message: 'Invalid contact number format' });
        }

        const quoteRequest = new QuoteRequest(req.body);
        const createdRequest = await quoteRequest.save();
        res.status(201).json(createdRequest);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getQuoteRequests = async (req: any, res: Response): Promise<void | any> => {
    try {
        let query = {};
        if (req.user && req.user.role !== 'Admin') {
            query = { workEmail: req.user.email };
        }
        const requests = await QuoteRequest.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Contact Requests ---

// @desc    Submit a contact request
// @route   POST /api/requests/contact
// @access  Public
export const submitContactRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const requiredError = checkRequiredFields(req.body, ['name', 'email', 'subject', 'message']);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        if (!validateEmail(req.body.email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (req.body.phone && !validateMobile(req.body.phone)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

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
export const getContactRequests = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const requests = await ContactRequest.find({}).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Booking Requests ---

// @desc    Submit a booking request
// @route   POST /api/requests/booking
// @access  Public
export const submitBookingRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const requiredFields = ['fullName', 'email', 'contactNumber', 'duration', 'startDate', 'workspaceId', 'workspaceName'];
        const requiredError = checkRequiredFields(req.body, requiredFields);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        if (!validateEmail(req.body.email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (req.body.contactNumber && !validateMobile(req.body.contactNumber)) {
            return res.status(400).json({ message: 'Invalid contact number format' });
        }

        const bookingRequest = new BookingRequest(req.body);
        const createdRequest = await bookingRequest.save();
        res.status(201).json(createdRequest);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all booking requests
// @route   GET /api/requests/booking
// @access  Private/Admin
export const getBookingRequests = async (req: any, res: Response): Promise<void | any> => {
    try {
        let query = {};
        if (req.user && req.user.role !== 'Admin') {
            query = { email: req.user.email };
        }
        const requests = await BookingRequest.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update booking request status
// @route   PUT /api/requests/booking/:id
// @access  Private/Admin
export const updateBookingRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Booking Request ID format' });
        }

        const updatedRequest = await BookingRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (updatedRequest) {
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Booking request not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: `Update failed: ${error.message}` });
    }
};

// --- Dashboard Stats ---

// @desc    Get dashboard stats
// @route   GET /api/requests/stats
// @access  Private/Admin
export const getDashboardStats = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const totalUsers = await User.countDocuments();
        const activeMembers = await User.countDocuments({ status: 'Active' });
        const newQuoteRequests = await QuoteRequest.countDocuments({ status: 'Pending' });
        const newBookingRequests = await BookingRequest.countDocuments({ status: 'Pending' });
        const newVisitRequests = await VisitRequest.countDocuments({ status: 'Pending' });

        // Mock revenue growth for now as requested in stats grid
        const revenueGrowth = "+12.5%";

        res.json({
            totalUsers,
            activeMembers,
            newQuoteRequests,
            newBookingRequests,
            newVisitRequests,
            revenueGrowth
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update quote request status
// @route   PUT /api/requests/quote/:id
// @access  Private/Admin
export const updateQuoteRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const idStr = String(req.params.id);
        const { status } = req.body;
        console.log(`>>> [%s] PUT /api/requests/quote/${idStr} | New Status: ${status}`, new Date().toISOString());

        if (!status) {
            res.status(400).json({ message: 'Status is required' });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(idStr)) {
            console.warn(`[WARN] Invalid Quote ID format: ${idStr}`);
            res.status(400).json({ message: 'Invalid Quote Request ID format' });
            return;
        }

        const updatedRequest = await QuoteRequest.findByIdAndUpdate(
            idStr,
            { status },
            { new: true, runValidators: true }
        );

        if (updatedRequest) {
            console.log(`[SUCCESS] Updated Quote ${idStr}`);
            res.json(updatedRequest);
        } else {
            console.log(`[ERROR] Quote ${idStr} not found in database`);
            res.status(404).json({ message: 'Quote request not found' });
        }
    } catch (error: any) {
        console.error(`[CRITICAL] Error updating quote: ${error.message}`);
        res.status(400).json({ message: `Update failed: ${error.message}` });
    }
};

// @desc    Update contact request status
// @route   PUT /api/requests/contact/:id
// @access  Private/Admin
export const updateContactRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;
        console.log(`>>> [%s] PUT /api/requests/contact/${id} | New Status: ${status}`, new Date().toISOString());

        if (!status) {
            res.status(400).json({ message: 'Status is required' });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn(`[WARN] Invalid Contact ID: ${id}`);
            res.status(400).json({ message: 'Invalid Contact Request ID format' });
            return;
        }

        const updatedRequest = await ContactRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (updatedRequest) {
            console.log(`[SUCCESS] Updated Contact ${id}`);
            res.json(updatedRequest);
        } else {
            console.log(`[ERROR] Contact ${id} not found in database`);
            res.status(404).json({ message: 'Contact inquiry not found' });
        }
    } catch (error: any) {
        console.error(`[CRITICAL] Error updating contact: ${error.message}`);
        res.status(400).json({ message: `Update failed: ${error.message}` });
    }
};

// --- Visit Requests ---

// @desc    Submit a visit request
// @route   POST /api/requests/visit
// @access  Public
export const submitVisitRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const requiredFields = ['fullName', 'email', 'contactNumber', 'visitDate', 'workspaceId', 'workspaceName'];
        const requiredError = checkRequiredFields(req.body, requiredFields);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        if (!validateEmail(req.body.email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (req.body.contactNumber && !validateMobile(req.body.contactNumber)) {
            return res.status(400).json({ message: 'Invalid contact number format' });
        }

        const visitRequest = new VisitRequest(req.body);
        const createdRequest = await visitRequest.save();
        res.status(201).json(createdRequest);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all visit requests
// @route   GET /api/requests/visit
// @access  Private/Admin
export const getVisitRequests = async (req: any, res: Response): Promise<void | any> => {
    try {
        let query = {};
        if (req.user && req.user.role !== 'Admin') {
            query = { email: req.user.email };
        }
        const requests = await VisitRequest.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update visit request status
// @route   PUT /api/requests/visit/:id
// @access  Private/Admin
export const updateVisitRequest = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Visit Request ID format' });
        }

        const updatedRequest = await VisitRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (updatedRequest) {
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Visit request not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: `Update failed: ${error.message}` });
    }
};
