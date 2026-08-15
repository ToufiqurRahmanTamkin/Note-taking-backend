import { Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { AuthRequest } from '../types';

/**
 * POST /api/posts — create a post authored by the current user.
 * Posts are visible to everyone; they exist to back the $lookup scenario.
 */
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    const post = await Post.create({ title, body, author: req.user!.id });
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};
