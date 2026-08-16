import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes (minimal set for the two list views on notes).
// { owner, createdAt }: a user listing their own notes, newest-first; the
// prefix also covers ownership-checked single-note reads.
noteSchema.index({ owner: 1, createdAt: -1 });
// { createdAt }: admin "view everyone's notes" — no owner filter, so the
// compound index above can't serve this sort.
noteSchema.index({ createdAt: -1 });

export const Note = model<INote>('Note', noteSchema);
