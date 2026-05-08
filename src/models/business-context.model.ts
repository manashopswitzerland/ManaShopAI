import { Schema, model, Document } from 'mongoose';

export interface IBusinessContext extends Document {
  content: string;
  updatedAt: Date;
}

const BusinessContextSchema = new Schema<IBusinessContext>(
  { content: { type: String, default: '' } },
  { timestamps: true }
);

export const BusinessContext = model<IBusinessContext>('BusinessContext', BusinessContextSchema);
