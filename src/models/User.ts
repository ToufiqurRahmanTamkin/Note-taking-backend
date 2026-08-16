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
    // select:false so the hash never leaks through ordinary queries.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Indexes (minimal by design — see the efficiency constraint).
// email (unique): login lookup + uniqueness on registration.
userSchema.index({ email: 1 }, { unique: true });
// createdAt: admin "list all users", paginated and sorted newest-first.
userSchema.index({ createdAt: -1 });
// interests (multikey): backs the "group users by interests" aggregation.
// (Single-user reads use the default _id index — no extra index needed.)
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
