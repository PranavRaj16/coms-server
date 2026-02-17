import { Request, Response } from 'express';
import Post from '../models/Post.js';

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, authorName } = req.body;
        const author = (req as any).user?._id;

        if (!content) {
            res.status(400).json({ message: 'Content is required' });
            return;
        }

        const post = await Post.create({
            content,
            author,
            authorName
        });

        res.status(201).json(post);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Upvote a post
// @route   PUT /api/posts/:id/upvote
// @access  Private
export const upvotePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const post = await Post.findById(req.params.id);
        const userId = (req as any).user?._id.toString();

        if (post) {
            const index = post.upvotes.indexOf(userId);
            if (index === -1) {
                post.upvotes.push(userId);
            } else {
                post.upvotes.splice(index, 1);
            }

            const updatedPost = await post.save();
            res.json(updatedPost);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, userName } = req.body;
        const user = (req as any).user?._id;

        if (!text) {
            res.status(400).json({ message: 'Comment text is required' });
            return;
        }

        const post = await Post.findById(req.params.id);

        if (post) {
            const comment = {
                user,
                userName,
                text,
                createdAt: new Date()
            };

            post.comments.push(comment as any);
            await post.save();
            res.status(201).json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        // Check if user is the author or admin
        const userId = (req as any).user?._id.toString();
        const isAdmin = (req as any).user?.role === 'Admin';

        if (post.author.toString() !== userId && !isAdmin) {
            res.status(401).json({ message: 'Not authorized to delete this post' });
            return;
        }

        await post.deleteOne();
        res.json({ message: 'Post removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upvote a comment
// @route   PUT /api/posts/:postId/comments/:commentId/upvote
// @access  Private
export const upvoteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        const userId = (req as any).user?._id.toString();

        if (post) {
            const comment = post.comments.find(c => c._id?.toString() === commentId);
            if (!comment) {
                res.status(404).json({ message: 'Comment not found' });
                return;
            }

            const index = comment.upvotes.indexOf(userId);
            if (index === -1) {
                comment.upvotes.push(userId);
            } else {
                comment.upvotes.splice(index, 1);
            }

            await post.save();
            res.json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);

        if (post) {
            const comment = post.comments.find(c => c._id?.toString() === commentId);
            if (!comment) {
                res.status(404).json({ message: 'Comment not found' });
                return;
            }

            // Check if user is the author or admin
            const userId = (req as any).user?._id.toString();
            const isAdmin = (req as any).user?.role === 'Admin';

            if (comment.user.toString() !== userId && !isAdmin) {
                res.status(401).json({ message: 'Not authorized to delete this comment' });
                return;
            }

            // Remove the comment
            post.comments = post.comments.filter(c => c._id?.toString() !== commentId) as any;
            await post.save();
            res.json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add a reply to a comment
// @route   POST /api/posts/:postId/comments/:commentId/replies
// @access  Private
export const addReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const { postId, commentId } = req.params;
        const { text, userName } = req.body;
        const user = (req as any).user?._id;

        if (!text) {
            res.status(400).json({ message: 'Reply text is required' });
            return;
        }

        const post = await Post.findById(postId);

        if (post) {
            const comment = post.comments.find(c => c._id?.toString() === commentId);
            if (!comment) {
                res.status(404).json({ message: 'Comment not found' });
                return;
            }

            const reply = {
                user,
                userName,
                text,
                createdAt: new Date()
            };

            comment.replies.push(reply as any);
            await post.save();
            res.status(201).json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
