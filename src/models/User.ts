import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Never selected by default so it can't leak through generic queries.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

/**
 * INDEXES (kept intentionally minimal — see task's efficiency constraint).
 *
 * 1) email (unique): supports login lookups (findOne by email) and enforces
 *    uniqueness on registration. This is the only single-document read path
 *    on users that isn't the primary key, so it must be indexed.
 */
userSchema.index({ email: 1 }, { unique: true });

/**
 * 2) createdAt: supports the admin "list all users" view, which is paginated
 *    and sorted by newest-first. Without it that sort would be an in-memory
 *    sort of the whole collection.
 */
userSchema.index({ createdAt: -1 });

/**
 * 3) interests (multikey): supports the "group users by interests" aggregation.
 *    The pipeline scans/unwinds the interests array; this multikey index lets
 *    that stage be served from an index instead of a full collection scan.
 *    (GET a single user profile uses the default _id index — no extra index.)
 */
userSchema.index({ interests: 1 });

// Hash the password whenever it is set/changed.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
