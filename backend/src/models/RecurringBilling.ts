import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringBilling extends Document {
  clientName: string;
  serviceDescription: string;
  amount: number;
  billingCycle: 'Monthly' | 'Yearly';
  nextBillingDate: Date;
  isActive: boolean;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recurringBillingSchema = new Schema<IRecurringBilling>(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    serviceDescription: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    billingCycle: {
      type: String,
      enum: ['Monthly', 'Yearly'],
      default: 'Monthly',
    },
    nextBillingDate: {
      type: Date,
      required: [true, 'Next billing date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastNotifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const RecurringBilling = mongoose.model<IRecurringBilling>('RecurringBilling', recurringBillingSchema);
