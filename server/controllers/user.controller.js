import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Skill } from '../models/skill.model.js';
import { Review } from '../models/review.model.js';
import opencage from 'opencage-api-client';

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }
  const user = await User.create({ username: username.toLowerCase(), email, password });
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  return res.status(200).cookie("refreshToken", refreshToken, options).cookie("accessToken", accessToken, options).json(new ApiResponse(200, { user: loggedInUser, accessToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { bio, locationString } = req.body;
  const updateData = {};
  if (bio !== undefined) updateData.bio = bio;
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
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true, runValidators: true }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) {
    throw new ApiError(400, "Avatar URL is required");
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { profilePicture: avatarUrl } }, { new: true }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).select("-password -refreshToken -role");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const [skills, reviews] = await Promise.all([
    Skill.find({ user: user._id, type: 'OFFER' }).sort({ createdAt: -1 }),
    Review.find({ reviewee: user._id }).sort({ createdAt: -1 }).populate('reviewer', 'username')
  ]);
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
  const profileData = { ...user.toObject(), averageRating, skills, reviews };
  return res.status(200).json(new ApiResponse(200, profileData, "User profile fetched successfully"));
});

export { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile, updateUserAvatar, getUserProfile };