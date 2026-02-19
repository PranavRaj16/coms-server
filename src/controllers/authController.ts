import { Request, Response } from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { validateEmail, validatePassword, checkRequiredFields } from '../utils/validation.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // If user status is Inactive, block login
            if (user.status === 'Inactive') {
                return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
            }

            // Update status to Active if it was Pending
            if (user.status === 'Pending') {
                user.status = 'Active';
                await user.save();
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                mobile: user.mobile,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const { name, email, password, role, mobile, organization } = req.body;

        const requiredError = checkRequiredFields(req.body, ['name', 'email', 'password']);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'Member',
            mobile,
            organization,
        });

        if (user) {
            // Send Welcome Email
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Welcome to Cohort Management Ecosystem',
                    message: `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                            <div style="background-color: #000; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 2px;">COHORT ECOSYSTEM</h1>
                            </div>
                            <div style="background-color: #fff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                                <h2 style="color: #333; margin-top: 0;">Welcome, ${user.name}!</h2>
                                <p style="color: #666; font-size: 16px; line-height: 1.6;">Your account has been successfully created. You now have access to the Cohort Management Ecosystem dashboard.</p>
                                
                                <div style="background-color: #f4f7f6; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e1e8e7;">
                                    <p style="margin-top: 0; font-weight: bold; color: #444;">Your Access Credentials:</p>
                                    <p style="margin: 10px 0; color: #555;"><strong>Email:</strong> <span style="color: #000; font-family: monospace;">${user.email}</span></p>
                                    <p style="margin: 10px 0; color: #555;"><strong>Password:</strong> <span style="color: #000; font-family: monospace;">${password}</span></p>
                                </div>

                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/login" 
                                       style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                       Sign In to Ecosystem
                                    </a>
                                </div>

                                <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
                                    Automated message from Cohort Management System. Please do not reply to this email.
                                </p>
                                <p style="color: #666; font-size: 14px; margin-bottom: 0;">
                                    Welcome aboard,<br>
                                    <strong>Cohort Operations Team</strong>
                                </p>
                            </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                mobile: user.mobile,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mobile: user.mobile,
                organization: user.organization,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: any, res: Response): Promise<void | any> => {
    try {
        const user = await User.findById(req.user?._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            user.organization = req.body.organization || user.organization;

            if (req.body.password) {
                if (!req.body.oldPassword) {
                    return res.status(400).json({ message: 'Old password is required to set a new one' });
                }
                const isMatch = await user.matchPassword(req.body.oldPassword);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Current password does not match' });
                }

                if (!validatePassword(req.body.password)) {
                    return res.status(400).json({ message: 'New password must be at least 6 characters' });
                }

                user.password = req.body.password;
            }

            if (req.body.email && !validateEmail(req.body.email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                mobile: updatedUser.mobile,
                organization: updatedUser.organization,
                token: generateToken(updatedUser._id.toString()),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
