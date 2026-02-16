import { Request, Response } from 'express';
import Workspace from '../models/Workspace.js';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get all workspaces
// @route   GET /api/workspaces
// @access  Public
export const getWorkspaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const workspaces = await Workspace.find({})
            .populate('allottedTo', 'name email organization')
            .sort({ createdAt: -1 });
        res.json(workspaces);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

// @desc    Get single workspace
// @route   GET /api/workspaces/:id
// @access  Public
export const getWorkspaceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const workspace = await Workspace.findById(req.params.id).populate('allottedTo', 'name email organization');
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
export const createWorkspace = async (req: Request, res: Response): Promise<void> => {
    try {
        const workspace = new Workspace(req.body);
        const createdWorkspace = await workspace.save();
        const populatedWorkspace = await Workspace.findById(createdWorkspace._id).populate('allottedTo', 'name email organization');
        res.status(201).json(populatedWorkspace);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a workspace
// @route   PUT /api/workspaces/:id
// @access  Private/Admin
export const updateWorkspace = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const workspace = await Workspace.findById(id);

        if (workspace) {
            // Update fields
            Object.keys(req.body).forEach(key => {
                if (key !== '_id' && key !== 'id') {
                    (workspace as any)[key] = req.body[key];
                }
            });

            const updatedWorkspace = await workspace.save();
            const populatedWorkspace = await Workspace.findById(updatedWorkspace._id).populate('allottedTo', 'name email organization');
            res.json(populatedWorkspace);
        } else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error updating workspace' });
    }
};

// @desc    Delete a workspace
// @route   DELETE /api/workspaces/:id
// @access  Private/Admin
export const deleteWorkspace = async (req: Request, res: Response): Promise<void> => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (workspace) {
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
export const getMyWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
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
            res.status(404).json({ message: 'No workspace allotted to you' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

// @desc    Get community members at the same location
// @route   GET /api/workspaces/community
// @access  Private
export const getCommunityMembers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        // Find current user's workspace to get location
        const myWorkspace = await Workspace.findOne({ allottedTo: req.user._id });

        if (!myWorkspace) {
            res.status(404).json({ message: 'Join a workspace to see your community' });
            return;
        }

        // Find all workspaces at this location and populate users
        const communityWorkspaces = await Workspace.find({
            location: myWorkspace.location,
            allottedTo: { $nin: [null, req.user._id] }
        }).populate('allottedTo', 'name email joinedDate role organization');

        const members = communityWorkspaces.map(ws => ({
            workspaceName: ws.name,
            user: ws.allottedTo
        }));

        res.json(members);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};
