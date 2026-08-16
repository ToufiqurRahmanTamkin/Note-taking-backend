import { Schema, model, Document, Types } from 'mongoose';

export type PostPrivacy = 'public' | 'private';

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  body: string;
  author: Types.ObjectId;
  privacy: PostPrivacy;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  },
  { timestamps: true }
);

// { author }: resolves the Scenario 2 $lookup (users -> posts) via an index
// seek on the foreign field.
postSchema.index({ author: 1 });
// { author, privacy }: backs the posters directory's per-author public count.
postSchema.index({ author: 1, privacy: 1 });

export const Post = model<IPost>('Post', postSchema);
