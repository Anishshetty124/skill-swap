import mongoose, { Schema } from 'mongoose';

const proposalSchema = new Schema(
  {
    proposer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    proposalType: { type: String, enum: ['skill', 'credits'], required: true },
    offeredSkill: { type: Schema.Types.ObjectId, ref: 'Skill' },
    costInCredits: { type: Number },
    status: { 
  type: String, 
  enum: ['pending', 'accepted', 'rejected', 'waiting', 'completed'], 
  default: 'pending' 
  },
    contactInfo: {
      phone: { type: String },
      email: { type: String },
      meetingLink: { type: String },
      meetingTime: { type: String },
      note: { type: String },
      },
      completedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      archivedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }] 
  },
  { timestamps: true }
);

export const Proposal = mongoose.model('Proposal', proposalSchema);
