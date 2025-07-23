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
      type: String,
      default: 'Flexible',
    },
    locationString: { // For user's text input
      type: String,
      default: 'Remote'
    },
    geoCoordinates: { // For GeoJSON data
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      }
    },
    status: {
      type: String,
      enum: ['active', 'in_progress', 'completed'],
      default: 'active',
    },
    tags: {
      type: [String],
      index: true
    }
  },
  { timestamps: true }
);

// Add necessary indexes
skillSchema.index({ geoCoordinates: '2dsphere' });
skillSchema.index({ title: 'text', description: 'text' });

export const Skill = mongoose.model('Skill', skillSchema);