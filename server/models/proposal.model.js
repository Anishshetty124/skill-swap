import mongoose, { Schema } from 'mongoose';

const proposalSchema = new Schema(
  {
    proposer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    proposalType: { type: String, enum: ['skill', 'credits'], required: true },
    
    // Optional fields, one will be present based on proposalType
    offeredSkill: { type: Schema.Types.ObjectId, ref: 'Skill' },
    costInCredits: { type: Number },

    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    contactInfo: { phone: { type: String }, note: { type: String } }
  },
  { timestamps: true }
);

export const Proposal = mongoose.model('Proposal', proposalSchema);