import express, { Router } from 'express';
import {
    getUsers,
    createUser,
    deleteUser,
    updateUser
} from '../controllers/userController.js';
import { authUser, registerUser, getUserProfile, updateUserProfile } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.post('/login', authUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/')
    .get(protect, admin, getUsers)
    .post(registerUser);

router.route('/:id')
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

export default router;
