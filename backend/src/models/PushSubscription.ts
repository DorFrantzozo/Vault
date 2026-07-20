import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceType?: string;
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    deviceType: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const PushSubscription = mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
