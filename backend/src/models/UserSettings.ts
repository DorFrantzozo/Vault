import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubKeys {
  p256dh: string;
  auth: string;
}

export interface IPushSubscriptionObject {
  endpoint: string;
  keys: IPushSubKeys;
  deviceType?: string;
  createdAt?: Date;
}

export interface IUserSettings extends Document {
  reminderDaysBefore: number;
  remindersPerDay: number;
  pushSubscriptions: IPushSubscriptionObject[];
  createdAt: Date;
  updatedAt: Date;
}

const pushSubSchema = new Schema<IPushSubscriptionObject>(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    deviceType: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSettingsSchema = new Schema<IUserSettings>(
  {
    reminderDaysBefore: {
      type: Number,
      default: 3,
      min: [1, 'Must be at least 1 day'],
      max: [30, 'Cannot exceed 30 days'],
    },
    remindersPerDay: {
      type: Number,
      default: 1,
      enum: [1, 2],
    },
    pushSubscriptions: {
      type: [pushSubSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);

/**
 * Singleton helper to retrieve or create default settings document.
 */
export async function getOrCreateUserSettings(): Promise<IUserSettings> {
  let settings = await UserSettings.findOne();
  if (!settings) {
    settings = await UserSettings.create({
      reminderDaysBefore: 3,
      remindersPerDay: 1,
      pushSubscriptions: [],
    });
  }
  return settings;
}
