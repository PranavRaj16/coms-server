import express from 'express';
import { getWorkspaces, getWorkspaceById, createWorkspace, updateWorkspace, deleteWorkspace } from '../controllers/workspaceController.js';
const router = express.Router();
router.route('/')
    .get(getWorkspaces)
    .post(createWorkspace);
router.route('/:id')
    .get(getWorkspaceById)
    .put(updateWorkspace)
    .delete(deleteWorkspace);
export default router;
