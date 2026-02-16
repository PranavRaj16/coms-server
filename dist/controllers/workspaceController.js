import Workspace from '../models/Workspace.js';
// @desc    Get all workspaces
// @route   GET /api/workspaces
// @access  Public
export const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({}).sort({ createdAt: -1 });
        res.json(workspaces);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get single workspace
// @route   GET /api/workspaces/:id
// @access  Public
export const getWorkspaceById = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (workspace) {
            res.json(workspace);
        }
        else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Create a workspace
// @route   POST /api/workspaces
// @access  Private/Admin
export const createWorkspace = async (req, res) => {
    try {
        const workspace = new Workspace(req.body);
        const createdWorkspace = await workspace.save();
        res.status(201).json(createdWorkspace);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// @desc    Update a workspace
// @route   PUT /api/workspaces/:id
// @access  Private/Admin
export const updateWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (workspace) {
            Object.assign(workspace, req.body);
            const updatedWorkspace = await workspace.save();
            res.json(updatedWorkspace);
        }
        else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// @desc    Delete a workspace
// @route   DELETE /api/workspaces/:id
// @access  Private/Admin
export const deleteWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (workspace) {
            await workspace.deleteOne();
            res.json({ message: 'Workspace removed' });
        }
        else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
