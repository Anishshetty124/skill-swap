import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Skill } from '../models/skill.model.js';
import { calculateBadges } from '../utils/badgeManager.js';
import sgMail from '@sendgrid/mail'; // Use SendGrid
import jwt from 'jsonwebtoken';
import opencage from 'opencage-api-client';

// --- SendGrid Setup ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  if ([firstName, lastName, username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters long.");
  if (!/[a-z]/.test(password)) throw new ApiError(400, "Password must contain at least one lowercase letter.");
  if (!/[A-Z]/.test(password)) throw new ApiError(400, "Password must contain at least one uppercase letter.");
  if (!/\d/.test(password)) throw new ApiError(400, "Password must contain at least one number.");
  if (!/[@$!%*?&]/.test(password)) throw new ApiError(400, "Password must contain at least one special character (@$!%*?&).");

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Set OTP to expire in 10 minutes
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    firstName,
    lastName,
    username: username.toLowerCase(),
    email,
    password,
    verificationOtp: otp, 
    verificationOtpExpiry: otpExpiry, 
  });

  const msg = {
    to: user.email,
    from: 'codex.5342@gmail.com', // Use your verified SendGrid email
    subject: 'Your SkillSwap Verification Code',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to SkillSwap!</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; background: #f0f0f0; padding: 10px; border-radius: 5px;">${otp}</p>
        <p style="font-size: 12px; color: #777;">This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid Error:", error);
    await User.findByIdAndDelete(user._id); 
    throw new ApiError(500, "Could not send verification email. Please try again later.");
  }

  return res.status(201).json(new ApiResponse(201, { email: user.email }, "Verification OTP sent to your email."));
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Username/email and password are required");
  }

  const user = await User.findOne({ $or: [{ email }, { username: email }] }).select("+password");
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // This check is still very important
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  
  const isFirstLogin = !user.welcomed;
  if (isFirstLogin) {
    user.welcomed = true;
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  const userPayload = { ...loggedInUser.toObject(), isFirstLogin };
  
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: userPayload, accessToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const bookmarkedSkills = await Skill.find({ bookmarkedBy: req.user._id }).select('_id');
  const bookmarkIds = bookmarkedSkills.map(skill => skill._id);
  const userData = { ...req.user.toObject(), bookmarks: bookmarkIds };
  return res.status(200).json(new ApiResponse(200, userData, "User profile fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { bio, locationString, socials, mobileNumber } = req.body;
  const updateData = {};
  if (bio !== undefined) updateData.bio = bio;
  if (socials) updateData.socials = socials;
  if (locationString) {
    updateData.locationString = locationString;
    try {
      const geoData = await opencage.geocode({ q: locationString, limit: 1, key: process.env.OPENCAGE_API_KEY });
      if (geoData.results.length > 0) {
        const { lng, lat } = geoData.results[0].geometry;
        updateData.location = { type: 'Point', coordinates: [lng, lat] };
      }
    } catch (error) {
      console.error("Geocoding failed:", error.message);
    }
  }
  if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
  
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true, runValidators: true }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { username, email, firstName, lastName } = req.body;
    if (!username || !email || !firstName || !lastName) {
        throw new ApiError(400, "First name, last name, username and email are required.");
    }
    const existingUser = await User.findOne({ 
        $or: [{ username }, { email }],
        _id: { $ne: req.user._id }
    });
    if (existingUser) {
        throw new ApiError(409, "Username or email is already in use by another account.");
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id, 
        { $set: { username, email, firstName, lastName } }, 
        { new: true }
    ).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) throw new ApiError(400, "Avatar URL is required");
  const optimizedUrl = avatarUrl.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto/');
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { profilePicture: optimizedUrl } }, { new: true }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const deleteUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { profilePicture: '' } }, { new: true }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "Avatar removed successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long.");
    }
    const user = await User.findById(req.user._id);
    user.password = newPassword;
    await user.save();
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully."));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).select("-password -refreshToken -role");
  if (!user) throw new ApiError(404, "User not found");
  
  let { earnedBadges, swapsCompleted, skillsOfferedCount } = await calculateBadges(user);

  const accountAgeInHours = (new Date() - user.createdAt) / (1000 * 60 * 60);
  if (accountAgeInHours > 24) {
    earnedBadges = earnedBadges.filter(badge => badge !== "New Member");
  }

  const [skills, bookmarks] = await Promise.all([
    Skill.find({ user: user._id, type: 'OFFER' }).sort({ createdAt: -1 }),
    Skill.find({ bookmarkedBy: user._id }).populate('user', 'username profilePicture').sort({ createdAt: -1 })
  ]);
   
 const calculateAvgRating = (skillList) => {
    return skillList.map(skill => {
      let averageRating = 0;
      if (skill.ratings && skill.ratings.length > 0) {
        const totalRating = skill.ratings.reduce((acc, r) => acc + r.rating, 0);
        averageRating = (totalRating / skill.ratings.length).toFixed(1);
      }
      return { ...skill.toObject(), averageRating };
    });
  };

  const skillsWithAvgRating = calculateAvgRating(skills);
  const bookmarksWithAvgRating = calculateAvgRating(bookmarks);

  const profileData = { ...user.toObject(), skillsOfferedCount, swapsCompleted, skills: skillsWithAvgRating, bookmarks: bookmarksWithAvgRating, badges: earnedBadges };
  return res.status(200).json(new ApiResponse(200, profileData, "User profile fetched successfully"));
});


const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const user = await User.findOne({ 
    email,
    verificationOtp: otp,
    verificationOtpExpiry: { $gt: Date.now() } // Check if OTP is not expired
  });

  if (!user) {
    throw new ApiError(400, "Invalid OTP or OTP has expired.");
  }

  user.isVerified = true;
  user.verificationOtp = undefined;
  user.verificationOtpExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully! You can now log in."));
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const user = await User.findOne({ email });
  if (!user) {
    // For security, don't reveal if the user exists.
    return res.status(200).json(new ApiResponse(200, {}, "If an account with this email exists, a new verification code has been sent."));
  }

  if (user.isVerified) {
    return res.status(200).json(new ApiResponse(200, {}, "This account has already been verified."));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.verificationOtp = otp;
  user.verificationOtpExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });

  const msg = {
    to: user.email,
    subject: 'Your New SkillSwap Verification Code',
    from: 'codex.5342@gmail.com', 
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Here is your new verification code</h2>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json(new ApiResponse(200, {}, "A new verification code has been sent to your email."));
  } catch (error) {
    console.error("SendGrid Error:", error);
    throw new ApiError(500, "Could not send verification email. Please try again later.");
  }
});

export {
  registerUser,
  verifyOtp,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  updateAccountDetails,
  updateUserAvatar,
  deleteUserAvatar,
  changePassword,
  getUserProfile,
  resendVerificationEmail
};
