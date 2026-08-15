import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Note } from '../models/Note';
import { AuthRequest } from '../types';
import { getPageParams, buildPage } from '../utils/pagination';

/** POST /api/notes — create a note owned by the current user. */
export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    const note = await Note.create({ title, content, owner: req.user!.id });
    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notes — list notes, paginated.
 *  - a regular user always sees only their own notes;
 *  - an admin sees everyone's notes, and may narrow to one user via ?userId.
 * Both paths are backed by the note indexes (owner+createdAt / createdAt).
 */
export const listNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const params = getPageParams(req);
    const filter: Record<string, unknown> = {};

    if (req.user!.role === 'admin') {
      if (req.query.userId) filter.owner = new Types.ObjectId(String(req.query.userId));
    } else {
      filter.owner = new Types.ObjectId(req.user!.id);
    }

    const [data, total] = await Promise.all([
      Note.find(filter).sort({ createdAt: -1 }).skip(params.skip).limit(params.limit),
      Note.countDocuments(filter),
    ]);

    res.json(buildPage(data, total, params));
  } catch (err) {
    next(err);
  }
};

/** GET /api/notes/:id — fetch a single note (owner-scoped unless admin). */
export const getNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (req.user!.role !== 'admin' && note.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not allowed to view this note' });
    }
    res.json({ note });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/notes/:id — update a note (owner only; admin may edit any). */
export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (req.user!.role !== 'admin' && note.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not allowed to edit this note' });
    }

    const { title, content } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    await note.save();

    res.json({ note });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/notes/:id — delete a note (owner only; admin may delete any). */
export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (req.user!.role !== 'admin' && note.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not allowed to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
};
