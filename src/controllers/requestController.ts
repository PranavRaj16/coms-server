import { Request, Response } from 'express';
import mongoose from 'mongoose';
import QuoteRequest from '../models/QuoteRequest.js';
import ContactRequest from '../models/ContactRequest.js';
import BookingRequest from '../models/BookingRequest.js';
import VisitRequest from '../models/VisitRequest.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Workspace from '../models/Workspace.js';
import crypto from 'crypto';
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
        const requiredFields = ['fullName', 'email', 'contactNumber', 'duration', 'startDate', 'workspaceId', 'workspaceName', 'paymentMethod'];
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

        // Fetch workspace to get price
        const workspace = await Workspace.findById(req.body.workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Calculate total amount
        let durationMonths = 0;
        const durationStr = req.body.duration;
        const parts = durationStr.split(" ");
        const num = parseFloat(parts[0]);
        const unit = parts[1]?.toLowerCase() || 'months';

        if (unit.startsWith('year')) durationMonths = num * 12;
        else if (unit.startsWith('month')) durationMonths = num;
        else if (unit.startsWith('week')) durationMonths = num / 4.34;
        else if (unit.startsWith('day')) durationMonths = num / 30.44;
        else if (unit.startsWith('hour')) durationMonths = num / (30.44 * 24);

        const totalAmount = Math.ceil(workspace.price * durationMonths);
        const invoiceId = `INV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // Calculate allotment dates
        const allotStart = new Date(req.body.startDate);
        const allotEnd = new Date(allotStart);
        if (unit.startsWith('year')) allotEnd.setFullYear(allotEnd.getFullYear() + num);
        else if (unit.startsWith('month')) allotEnd.setMonth(allotEnd.getMonth() + num);
        else if (unit.startsWith('week')) allotEnd.setDate(allotEnd.getDate() + num * 7);
        else if (unit.startsWith('day')) allotEnd.setDate(allotEnd.getDate() + num);
        else if (unit.startsWith('hour')) allotEnd.setHours(allotEnd.getHours() + num);

        const bookingData = {
            ...req.body,
            totalAmount,
            invoiceId,
            paymentStatus: req.body.paymentMethod === 'Pay Now' ? 'Paid' : 'Pending',
            status: req.body.paymentMethod === 'Pay Now' ? 'Confirmed' : 'Awaiting Payment'
        };

        const bookingRequest = new BookingRequest(bookingData);
        const createdRequest = await bookingRequest.save();

        // Handle Automatic Allotment for "Pay Now"
        if (req.body.paymentMethod === 'Pay Now') {
            let userId = (req as any).user?._id;
            if (!userId) {
                const user = await User.findOne({ email: req.body.email });
                if (user) userId = user._id;
            }

            if (userId) {
                await Workspace.findByIdAndUpdate(req.body.workspaceId, {
                    allottedTo: userId,
                    allotmentStart: allotStart,
                    allotmentEnd: allotEnd
                });
            }
        }

        // Create Invoice record
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7 days due date for pay later

        const invoice = new Invoice({
            invoiceNumber: invoiceId,
            bookingId: createdRequest._id,
            userId: (req as any).user?._id || null,
            customerName: req.body.fullName,
            customerEmail: req.body.email,
            workspaceName: req.body.workspaceName,
            amount: totalAmount,
            paymentMethod: req.body.paymentMethod,
            status: bookingData.paymentStatus,
            dueDate: dueDate,
            paidDate: req.body.paymentMethod === 'Pay Now' ? new Date() : undefined
        });

        // Find user by email to associate userId if not in req.user
        if (!invoice.userId) {
            const user = await User.findOne({ email: req.body.email });
            if (user) invoice.userId = user._id;
        }

        await invoice.save();

        res.status(201).json({
            booking: createdRequest,
            invoice
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all invoices
// @route   GET /api/requests/invoices
// @access  Private
export const getInvoices = async (req: any, res: Response): Promise<void | any> => {
    try {
        let query = {};
        if (req.user && req.user.role !== 'Admin') {
            query = { customerEmail: req.user.email };
        }
        const invoices = await Invoice.find(query)
            .populate('bookingId')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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
