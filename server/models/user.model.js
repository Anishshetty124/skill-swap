import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Skill } from './skill.model.js';
import { Proposal } from './proposal.model.js';
import { Conversation } from './conversation.model.js';
import { Message } from './message.model.js';

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  googleId: { type: String },
  mobileNumber: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        if (v === null || v === '') return true;
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: false }, 
  isVerified: { type: Boolean, default: false }, 
  verificationOtp: { type: String }, 
  verificationOtpExpiry: { type: Date }, 
  passwordResetOtp: { type: String },
  passwordResetOtpExpiry: { type: Date },
  newEmail: { type: String, lowercase: true, trim: true },
  emailChangeOtp: { type: String },
  emailChangeOtpExpiry: { type: Date },
  reportCount: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  socials: { github: { type: String, default: '' }, linkedin: { type: String, default: '' }, website: { type: String, default: '' } },
  locationString: { type: String, default: '' },
  location: { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } },
  refreshToken: { type: String },
  swapCredits: { type: Number, default: 10 },
  badges: { type: [String], default: [] }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const userId = this._id;
  try {
    await Skill.deleteMany({ user: userId });
    const proposals = await Proposal.find({ $or: [{ proposer: userId }, { receiver: userId }] });
    const proposalIds = proposals.map(p => p._id);
    const conversations = await Conversation.find({ participants: userId });
    for (const conv of conversations) {
      await Message.deleteMany({ _id: { $in: conv.messages } });
    }
    await Conversation.deleteMany({ participants: userId });
    await Proposal.deleteMany({ _id: { $in: proposalIds } });
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isPasswordCorrect = async function(password) {
  if (!this.password) return false; 
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model('User', userSchema);
