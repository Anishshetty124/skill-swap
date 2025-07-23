import mongoose, { Schema } from 'mongoose';

const skillSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['OFFER', 'REQUEST'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Expert'],
      default: 'Intermediate',
    },
    availability: {
      type: String, // e.g., "Weekends", "Evenings"
      default: 'Flexible',
    },
    location: {
      type: String, // e.g., "Remote", "Mudhol, Karnataka"
      default: 'Remote',
    },
    status: {
      type: String,
      enum: ['active', 'in_progress', 'completed'],
      default: 'active',
    },
     tags: {
      type: [String],
      index: true // Add index for faster queries on tags
    }
  },
  { timestamps: true }
);
skillSchema.index({ title: 'text', description: 'text' });

export const Skill = mongoose.model('Skill', skillSchema);