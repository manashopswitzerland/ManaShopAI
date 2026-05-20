import { Schema, model, Document } from 'mongoose';
import type { Channel, StoreId, MessageRole, ConversationStatus } from '../types';

export interface IMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  channel: Channel;
  sessionId: string;
  storeId: StoreId;
  status: ConversationStatus;
  customerContact: string;
  draftReply: string;
  messages: IMessage[];
  awaitingContact: boolean;
  leadCaptured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    channel: {
      type: String,
      enum: ['whatsapp', 'web', 'email', 'facebook', 'instagram'],
      required: true,
      index: true,
    },
    sessionId: { type: String, required: true, index: true },
    storeId: {
      type: String,
      enum: ['mana-shop', 'mana-kendra'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ai', 'human_pending', 'human', 'resolved'],
      default: 'ai',
      index: true,
    },
    customerContact: { type: String, default: '' },
    draftReply: { type: String, default: '' },
    messages: { type: [MessageSchema], default: [] },
    awaitingContact: { type: Boolean, default: false },
    leadCaptured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ sessionId: 1, channel: 1 }, { unique: true });

export const Conversation = model<IConversation>('Conversation', ConversationSchema);
