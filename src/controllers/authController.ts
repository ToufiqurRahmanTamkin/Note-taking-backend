import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/token';
import { AuthRequest } from '../types';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const publicUser = (u: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
}) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register — self-service signup; role is always "user".
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, interests } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const user = await User.create({
      name,
      email,
      password,
      interests: Array.isArray(interests) ? interests : [],
    });
    const token = signToken({ id: user._id.toString(), role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login — verify credentials, return a JWT.
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    // Reject non-string input so a crafted object can't reach the query layer.
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id.toString(), role: user.role });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — current user's profile.
export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
