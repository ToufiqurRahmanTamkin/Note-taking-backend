import { Router } from 'express';
import { createPost, listPosters } from '../controllers/postController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createPost);
router.get('/posters', listPosters);

export default router;
