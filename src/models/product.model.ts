import { Schema, model, Document } from 'mongoose';
import type { StoreId } from '../types';

export interface IProduct extends Document {
  storeId: StoreId;
  shopifyProductId: number;
  title: string;
  descriptionHtml: string;
  plainDescription: string;
  price: string;
  currency: string;
  tags: string[];
  vendor: string;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: {
      type: String,
      enum: ['mana-shop', 'mana-kendra'],
      required: true,
      index: true,
    },
    shopifyProductId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    descriptionHtml: { type: String, default: '' },
    plainDescription: { type: String, default: '' },
    price: { type: String, default: '0.00' },
    currency: { type: String, default: 'CHF' },
    tags: { type: [String], default: [] },
    vendor: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ title: 'text', plainDescription: 'text', tags: 'text' });

export const Product = model<IProduct>('Product', ProductSchema);
