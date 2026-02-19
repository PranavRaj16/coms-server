import { Request, Response } from 'express';
import Workspace from '../models/Workspace.js';
import { checkRequiredFields } from '../utils/validation.js';
import { v2 as cloudinary } from 'cloudinary';

interface AuthRequest extends Request {
    user?: any;
}

const DEFAULT_WORKSPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format';

// @desc    Get all workspaces
// @route   GET /api/workspaces
// @access  Public
export const getWorkspaces = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const workspaces = await Workspace.find({})
            .populate('allottedTo', 'name email mobile organization')
            .sort({ createdAt: -1 });
        res.json(workspaces);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

// @desc    Get single workspace
// @route   GET /api/workspaces/:id
// @access  Public
export const getWorkspaceById = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const workspace = await Workspace.findById(req.params.id).populate('allottedTo', 'name email mobile organization');
        if (workspace) {
            res.json(workspace);
        } else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a workspace
// @route   POST /api/workspaces
// @access  Private/Admin
export const createWorkspace = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const requiredError = checkRequiredFields(req.body, ['name', 'location', 'type', 'capacity']);
        if (requiredError) {
            return res.status(400).json({ message: requiredError });
        }

        const workspace = new Workspace(req.body);
        const createdWorkspace = await workspace.save();
        const populatedWorkspace = await Workspace.findById(createdWorkspace._id).populate('allottedTo', 'name email mobile organization');
        res.status(201).json(populatedWorkspace);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a workspace
// @route   PUT /api/workspaces/:id
// @access  Private/Admin
export const updateWorkspace = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const { id } = req.params;
        const workspace = await Workspace.findById(id);

        if (workspace) {
            // Validate required fields if they are being updated
            const updateFields = Object.keys(req.body);
            if (updateFields.includes('name') && !req.body.name) {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            if (updateFields.includes('location') && !req.body.location) {
                return res.status(400).json({ message: 'Location cannot be empty' });
            }

            // Handle image removal from Cloudinary if images array is provided in body
            if (req.body.images && Array.isArray(req.body.images)) {
                const removedImages = workspace.images.filter(url => !req.body.images.includes(url));
                for (const url of removedImages) {
                    try {
                        // Extract public_id from Cloudinary URL
                        const publicId = url.split('/').pop()?.split('.')[0];
                        if (publicId) {
                            await cloudinary.uploader.destroy(`coms-workspaces/${publicId}`);
                        }
                    } catch (err) {
                        console.error('Failed to delete image from Cloudinary:', err);
                    }
                }
            }

            // Update fields
            Object.keys(req.body).forEach(key => {
                if (key !== '_id' && key !== 'id') {
                    (workspace as any)[key] = req.body[key];
                }
            });

            // Ensure image (primary) is synced with images array
            if (workspace.images && workspace.images.length > 0) {
                if (!workspace.images.includes(workspace.image || '')) {
                    workspace.image = workspace.images[0];
                }
            } else if (!workspace.image) {
                // If images array is empty and no primary image is set, use default
                workspace.image = DEFAULT_WORKSPACE_IMAGE;
            }

            const updatedWorkspace = await workspace.save();
            const populatedWorkspace = await Workspace.findById(updatedWorkspace._id).populate('allottedTo', 'name email mobile organization');
            res.json(populatedWorkspace);
        } else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error updating workspace' });
    }
};

// @desc    Upload workspace images
// @route   POST /api/workspaces/:id/images
// @access  Private/Admin
export const uploadWorkspaceImages = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        const imageUrls = files.map(file => file.path);

        // Combine existing images with new ones, limit to 3 total
        const totalImages = [...(workspace.images || []), ...imageUrls].slice(0, 3);

        workspace.images = totalImages;
        if (totalImages.length > 0) {
            workspace.image = totalImages[0]; // Set first as primary
        }

        await workspace.save();
        res.json(workspace);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a workspace
// @route   DELETE /api/workspaces/:id
// @access  Private/Admin
export const deleteWorkspace = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (workspace) {
            // Delete images from Cloudinary
            if (workspace.images && workspace.images.length > 0) {
                for (const url of workspace.images) {
                    try {
                        const publicId = url.split('/').pop()?.split('.')[0];
                        if (publicId) {
                            await cloudinary.uploader.destroy(`coms-workspaces/${publicId}`);
                        }
                    } catch (err) {
                        console.error('Failed to delete image from Cloudinary during workspace deletion:', err);
                    }
                }
            }
            await workspace.deleteOne();
            res.json({ message: 'Workspace removed' });
        } else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user's workspace
// @route   GET /api/workspaces/my-workspace
// @access  Private
export const getMyWorkspace = async (req: AuthRequest, res: Response): Promise<void | any> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const workspace = await Workspace.findOne({ allottedTo: req.user._id })
            .populate('allottedTo', 'name email mobile organization');

        if (workspace) {
            res.json(workspace);
        } else {
            console.log(`[MY-WORKSPACE] No workspace assigned to user ${req.user._id}`);
            res.json(null); // Return 200 with null instead of 404
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

// @desc    Get community members at the same location
// @route   GET /api/workspaces/community
// @access  Private
export const getCommunityMembers = async (req: AuthRequest, res: Response): Promise<void | any> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        // Find current user's workspace to get location
        const myWorkspace = await Workspace.findOne({ allottedTo: req.user._id });

        if (!myWorkspace) {
            console.log(`[COMMUNITY] User ${req.user._id} has no workspace, cannot see community`);
            res.json([]); // Return empty array instead of 404
            return;
        }

        // Find all workspaces at this location and populate users
        const communityWorkspaces = await Workspace.find({
            location: myWorkspace.location,
            allottedTo: { $nin: [null, req.user._id] }
        }).populate('allottedTo', 'name email mobile joinedDate role organization');

        const members = communityWorkspaces.map(ws => ({
            workspaceName: ws.name,
            user: ws.allottedTo
        }));

        res.json(members);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};
