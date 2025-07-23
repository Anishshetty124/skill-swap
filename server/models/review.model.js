import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    proposal: {
      type: Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only review a specific proposal once
reviewSchema.index({ proposal: 1, reviewer: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);