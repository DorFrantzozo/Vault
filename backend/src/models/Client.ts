import mongoose, { Schema, Document } from 'mongoose';

export type ClientType = 'Club' | 'Producer' | 'Restaurant' | 'Private';

export interface IClient extends Document {
  name: string;
  type: ClientType;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  defaultEventPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Club', 'Producer', 'Restaurant', 'Private'],
      required: [true, 'Client type is required'],
    },
    contactInfo: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    defaultEventPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Client = mongoose.model<IClient>('Client', ClientSchema);
