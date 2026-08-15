import { Router } from 'express';
import { usersByInterest, userPosts } from '../controllers/aggregationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// "Group users by interests" is an admin-facing overview.
router.get('/users-by-interest', authorize('admin'), usersByInterest);

// A user's posts are visible to everyone, so any authenticated user may read them.
router.get('/users/:id/posts', userPosts);

export default router;
