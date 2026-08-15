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

/**
 * INDEXES (minimal set for the two list views on notes).
 *
 * 1) { owner: 1, createdAt: -1 }: serves a user listing THEIR OWN notes,
 *    paginated and sorted newest-first. The same compound index also covers
 *    fetching a single note filtered by owner (ownership-checked reads),
 *    so no separate index on `owner` alone is needed.
 */
noteSchema.index({ owner: 1, createdAt: -1 });

/**
 * 2) { createdAt: -1 }: serves the admin "view everyone's notes" list, which
 *    has no owner filter and is sorted newest-first. The compound index above
 *    cannot serve a sort that isn't prefixed by `owner`, so this one is
 *    genuinely required for the admin global feed.
 */
noteSchema.index({ createdAt: -1 });

export const Note = model<INote>('Note', noteSchema);
