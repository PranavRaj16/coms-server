import express, { Router } from 'express';
import {
    getPosts,
    createPost,
    upvotePost,
    addComment,
    deletePost,
    upvoteComment,
    addReply,
    deleteComment
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router: Router = express.Router();

router.route('/')
    .get(protect, getPosts)
    .post(protect, createPost);

router.route('/:id')
    .delete(protect, deletePost);

router.route('/:id/upvote')
    .put(protect, upvotePost);

router.route('/:id/comments')
    .post(protect, addComment);

router.route('/:postId/comments/:commentId')
    .delete(protect, deleteComment);

router.route('/:postId/comments/:commentId/upvote')
    .put(protect, upvoteComment);

router.route('/:postId/comments/:commentId/replies')
    .post(protect, addReply);

export default router;
