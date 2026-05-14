import { Schema, model, Document } from 'mongoose';

export interface ILead extends Document {
  phone: string;
  email: string;
  interest: string;
  sessionId: string;
  storeId: string;
  channel: string;
  status: 'new' | 'contacted' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    phone:     { type: String, default: '' },
    email:     { type: String, default: '' },
    interest:  { type: String, default: '' },
    sessionId: { type: String, required: true },
    storeId:   { type: String, required: true },
    channel:   { type: String, required: true },
    status:    { type: String, enum: ['new', 'contacted', 'done'], default: 'new' },
  },
  { timestamps: true }
);

export const Lead = model<ILead>('Lead', LeadSchema);
