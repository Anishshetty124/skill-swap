import mongoose, { Schema } from 'mongoose';

const feedbackSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    feedbackType: {
      type: String,
      enum: ['bug', 'suggestion', 'other'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);