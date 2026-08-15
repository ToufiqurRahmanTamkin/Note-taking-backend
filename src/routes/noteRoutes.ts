import { Router } from 'express';
import {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Every note route requires a logged-in user.
router.use(authenticate);

router.route('/').post(createNote).get(listNotes);
router.route('/:id').get(getNote).put(updateNote).delete(deleteNote);

export default router;
