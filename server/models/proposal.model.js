import mongoose, { Schema } from 'mongoose';

const proposalSchema = new Schema(
  {
    proposer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    offeredSkill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    requestedSkill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const Proposal = mongoose.model('Proposal', proposalSchema);