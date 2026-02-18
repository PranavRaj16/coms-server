import { Request, Response } from 'express';
import User from '../models/User.js';
import { validateEmail, validatePassword, checkRequiredFields, validateMobile } from '../utils/validation.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
export const createUser = async (req: Request, res: Response): Promise<any | void> => {
    try {
        const { name, email, role, mobile, organization, password } = req.body;
        const requiredError = checkRequiredFields(req.body, ['name', 'email']);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password && !validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        if (mobile && !validateMobile(mobile)) {
            return res.status(400).json({ message: 'Invalid mobile number format' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password: password || 'password123', // Default password if not provided
            role: role || 'Member',
            mobile,
            organization
        });

        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (req.body.email && !validateEmail(req.body.email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            if (req.body.mobile && !validateMobile(req.body.mobile)) {
                return res.status(400).json({ message: 'Invalid mobile number format' });
            }

            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.mobile = req.body.mobile || user.mobile;
            user.organization = req.body.organization || user.organization;
            user.status = req.body.status || user.status;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                organization: updatedUser.organization,
                mobile: updatedUser.mobile,
                status: updatedUser.status,
                joinedDate: updatedUser.joinedDate,
                lastActive: updatedUser.lastActive
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
