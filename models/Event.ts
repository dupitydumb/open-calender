import mongoose, { Schema, Model } from 'mongoose';

export interface IEvent {
  id: string;
  title: string;
  description?: string;
  color: string;
  day?: string;
  timeSlot?: number;
  duration?: number;
  weekStart?: string;
  location?: string;
  link?: string;
  notes?: string;
  attendees?: string;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  isRecurring?: boolean;
  recurringGroupId?: string;
}

const EventSchema = new Schema<IEvent>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    color: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    timeSlot: {
      type: Number,
      min: 0,
      max: 95,
    },
    duration: {
      type: Number,
      min: 1,
      max: 48,
    },
    weekStart: {
      type: String,
    },
    location: {
      type: String,
    },
    link: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: 300,
    },
    attendees: {
      type: String,
      maxlength: 200,
    },
    repeatType: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    repeatEndDate: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringGroupId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
