import mongoose, { Schema, Document, Types } from 'mongoose';

export type EventType = 'DJ Gig' | 'Software Development' | 'Maintenance' | 'Consulting';
export type EventStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface IServiceEvent extends Document {
  client: Types.ObjectId;
  type: EventType;
  date: Date;
  description?: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceEventSchema: Schema<IServiceEvent> = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['DJ Gig', 'Software Development', 'Maintenance', 'Consulting'],
      required: [true, 'Event type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
  },
  {
    timestamps: true,
  }
);

ServiceEventSchema.index({ client: 1, date: -1 });

export const ServiceEvent = mongoose.model<IServiceEvent>('ServiceEvent', ServiceEventSchema);
