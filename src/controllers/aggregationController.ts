import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { AuthRequest } from '../types';

/**
 * Scenario 1 — Group users by interests.
 * GET /api/aggregations/users-by-interest
 *
 * Constraint: EXACTLY ONE collection.aggregate() call, no other methods.
 * The { interests: 1 } multikey index supports the initial scan of the
 * interests values. Returns, for each distinct interest, the count and the
 * list of users who share it.
 */
export const usersByInterest = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await User.aggregate([
      // Flatten the interests array into one document per (user, interest).
      { $unwind: '$interests' },
      // Bucket by interest, collecting the members and a count.
      {
        $group: {
          _id: '$interests',
          userCount: { $sum: 1 },
          users: { $push: { id: '$_id', name: '$name', email: '$email' } },
        },
      },
      // Present a clean shape and a stable ordering.
      { $project: { _id: 0, interest: '$_id', userCount: 1, users: 1 } },
      { $sort: { userCount: -1, interest: 1 } },
    ]);

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * Scenario 2 — Retrieve all posts belonging to a particular user.
 * GET /api/aggregations/users/:id/posts
 *
 * Constraint: a SINGLE aggregation pipeline using a $lookup stage. The join
 * is resolved through the { author: 1 } index on the posts collection.
 */
export const userPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = new Types.ObjectId(req.params.id);

    const result = await User.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          postCount: { $size: '$posts' },
          posts: {
            $map: {
              input: '$posts',
              as: 'p',
              in: { id: '$$p._id', title: '$$p.title', body: '$$p.body', createdAt: '$$p.createdAt' },
            },
          },
        },
      },
    ]);

    if (result.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ data: result[0] });
  } catch (err) {
    next(err);
  }
};
