import { Schema, model, Document } from 'mongoose';

export interface IFcmToken extends Document {
  token: string;
  deviceId: string;
  updatedAt: Date;
}

const FcmTokenSchema = new Schema<IFcmToken>(
  {
    token:    { type: String, required: true },
    deviceId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const FcmToken = model<IFcmToken>('FcmToken', FcmTokenSchema);
