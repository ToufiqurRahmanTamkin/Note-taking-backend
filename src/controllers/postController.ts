import { Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { AuthRequest } from '../types';

/**
 * POST /api/posts — create a post authored by the current user.
 * Public posts are visible to everyone; private posts are visible only to
 * the author (and admins). Defaults to public when omitted.
 */
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, body, privacy } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    if (privacy !== undefined && privacy !== 'public' && privacy !== 'private') {
      return res.status(400).json({ message: 'privacy must be "public" or "private"' });
    }

    const post = await Post.create({
      title,
      body,
      author: req.user!.id,
      privacy: privacy === 'private' ? 'private' : 'public',
    });
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/posters — directory of everyone who has posted, with their
 * public post count. Backed by a single aggregate() call: group posts by
 * author (counting public ones), then $lookup the owning user for name/email.
 */
export const listPosters = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await Post.aggregate([
      {
        $group: {
          _id: '$author',
          publicPostCount: {
            $sum: { $cond: [{ $eq: ['$privacy', 'public'] }, 1, 0] },
          },
          totalPostCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          id: '$_id',
          name: '$user.name',
          email: '$user.email',
          publicPostCount: 1,
          totalPostCount: 1,
        },
      },
      { $sort: { publicPostCount: -1, name: 1 } },
    ]);

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};
