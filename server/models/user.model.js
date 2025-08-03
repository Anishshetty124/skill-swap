import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  mobileNumber: { type: String, trim: true,
     validate: {
      validator: function(v) {
        if (v === null || v === '') {
            return true;
        }
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, 
  verificationOtp: { type: String }, 
  verificationOtpExpiry: { type: Date }, 
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  socials: { github: { type: String, default: '' }, linkedin: { type: String, default: '' }, website: { type: String, default: '' } },
  locationString: { type: String, default: '' },
  location: { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } },
  refreshToken: { type: String },
  swapCredits: { type: Number, default: 10 },
  welcomed: { type: Boolean, default: false },
  badges: { type: [String], default: [] }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
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
