import express, { Router } from 'express';
import {
    getWorkspaces,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getMyWorkspace,
    getCommunityMembers
} from '../controllers/workspaceController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.route('/my-workspace').get(protect, getMyWorkspace);
router.route('/community').get(protect, getCommunityMembers);

router.route('/')
    .get(getWorkspaces)
    .post(protect, admin, createWorkspace);

router.route('/:id')
    .get(getWorkspaceById)
    .put(protect, admin, updateWorkspace)
    .delete(protect, admin, deleteWorkspace);

export default router;
