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

// { author }: resolves the Scenario 2 $lookup (users -> posts) via an index
// seek on the foreign field. The only index posts need.
postSchema.index({ author: 1 });

export const Post = model<IPost>('Post', postSchema);
