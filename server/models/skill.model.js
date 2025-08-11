import mongoose, { Schema } from 'mongoose';

const ratingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, { _id: false });

const skillSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['OFFER', 'REQUEST'], required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Intermediate' },
  availability: { type: String, default: 'Flexible' },
  locationString: { type: String, default: 'Remote' },
  geoCoordinates: { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } },
  tags: [String],
  status: { type: String, enum: ['active', 'in_progress', 'completed'], default: 'active' },
  ratings: [ratingSchema],
  bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  costInCredits: {
    type: Number,
    default: 1,
    min: 0
  },
  creditsOffered: {
    type: Number,
    default: 1,
    min: 0
  },
  desiredSkill: { type: String, trim: true },
}, { timestamps: true });
 
skillSchema.index({ title: 'text', description: 'text', tags: 'text' });
skillSchema.index({ geoCoordinates: '2dsphere' });

skillSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const skillId = this._id;
  try {
    await mongoose.model('Proposal').deleteMany({
      $or: [{ requestedSkill: skillId }, { offeredSkill: skillId }]
    });
    next();
  } catch (error) {
    next(error);
  }
});

export const Skill = mongoose.model('Skill', skillSchema);