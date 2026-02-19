import { Request, Response } from 'express';
import User from '../models/User.js';
import { validateEmail, validatePassword, checkRequiredFields, validateMobile } from '../utils/validation.js';
import sendEmail from '../utils/sendEmail.js';

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

        const userPassword = password || 'password123';
        const user = await User.create({
            name,
            email,
            password: userPassword,
            role: role || 'Member',
            mobile,
            organization
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
                                <p style="color: #666; font-size: 16px; line-height: 1.6;">Your account has been successfully created by the administrator. You now have access to the Cohort Management Ecosystem dashboard.</p>
                                
                                <div style="background-color: #f4f7f6; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e1e8e7;">
                                    <p style="margin-top: 0; font-weight: bold; color: #444;">Your Access Credentials:</p>
                                    <p style="margin: 10px 0; color: #555;"><strong>Email:</strong> <span style="color: #000; font-family: monospace;">${user.email}</span></p>
                                    <p style="margin: 10px 0; color: #555;"><strong>Temporary Password:</strong> <span style="color: #000; font-family: monospace;">${userPassword}</span></p>
                                </div>

                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/login" 
                                       style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                       Sign In to Ecosystem
                                    </a>
                                </div>

                                <div style="background-color: #fff9e6; padding: 20px; border-left: 4px solid #ffcc00; margin-bottom: 30px;">
                                    <p style="margin: 0; font-size: 15px; color: #856404; line-height: 1.5;">
                                        <strong>Immediate Action Required:</strong> For your security, you must <strong>change your password</strong>. Please log in and navigate to your <strong>Profile Section</strong> to update your credentials.
                                    </p>
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
        }

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
