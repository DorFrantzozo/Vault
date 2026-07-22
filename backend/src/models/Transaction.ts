import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionType = 'Income' | 'Expense';
export type ServiceCategory = 'DJ Gig' | 'Software Development' | 'Maintenance' | 'Consulting' | 'General';

export interface ITransaction extends Document {
  type: TransactionType;
  serviceType: ServiceCategory;
  amount: number;
  date: Date;
  client?: Types.ObjectId;
  relatedEvent?: Types.ObjectId;
  relatedBilling?: Types.ObjectId;
  attachmentUrl?: string;
  publicId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    serviceType: {
      type: String,
      enum: ['DJ Gig', 'Software Development', 'Maintenance', 'Consulting', 'General'],
      default: 'General',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceEvent',
    },
    relatedBilling: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringBilling',
    },
    attachmentUrl: {
      type: String,
    },
    publicId: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ date: -1, type: 1 });
TransactionSchema.index({ client: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
