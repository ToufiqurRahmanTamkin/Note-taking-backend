import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  body: string;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

/**
 * INDEX (single, required by the $lookup aggregation).
 *
 * { author: 1 }: Scenario 2 retrieves all posts belonging to a particular
 * user via a $lookup from users -> posts. MongoDB resolves that join using an
 * index on the FOREIGN field (posts.author); this index makes the lookup an
 * index seek instead of a per-parent collection scan. Posts are visible to
 * everyone, so there is no per-owner access filter needing anything more.
 */
postSchema.index({ author: 1 });

export const Post = model<IPost>('Post', postSchema);
