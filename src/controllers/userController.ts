import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { getPageParams, buildPage } from '../utils/pagination';

/**
 * GET /api/users — admin lists all users, paginated and sorted newest-first.
 * Backed by the { createdAt: -1 } index on users.
 */
export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const params = getPageParams(req);
    const [data, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(params.skip).limit(params.limit),
      User.countDocuments(),
    ]);
    res.json(buildPage(data, total, params));
  } catch (err) {
    next(err);
  }
};

/** GET /api/users/:id — admin fetches a single user profile (by _id index). */
export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/** POST /api/users — admin creates a user (may set role and interests). */
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, interests } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const user = await User.create({ name, email, password, role, interests });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/users/:id — admin updates a user's fields. */
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, role, interests } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (interests !== undefined) user.interests = interests;
    if (password) user.password = password; // re-hashed by the pre-save hook
    await user.save();

    const safe = user.toObject();
    delete (safe as { password?: string }).password;
    res.json({ user: safe });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/users/:id — admin removes a user. */
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
