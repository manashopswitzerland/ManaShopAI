import { Schema, model, Document } from 'mongoose';
import type { Language } from '../types';

export interface IFaq extends Document {
  question: string;
  answer: string;
  tags: string[];
  language: Language;
  createdAt: Date;
}

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    tags: { type: [String], default: [] },
    language: {
      type: String,
      enum: ['de', 'en'],
      required: true,
      default: 'de',
    },
  },
  {
    timestamps: true,
  }
);

FaqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

export const Faq = model<IFaq>('Faq', FaqSchema);
