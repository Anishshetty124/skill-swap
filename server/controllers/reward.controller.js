import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

const claimDailyReward = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();
  const lastRoll = user.lastLuckyRoll ? new Date(user.lastLuckyRoll) : null;

  if (lastRoll && now.toDateString() === lastRoll.toDateString()) {
    throw new ApiError(400, "You have already claimed your daily reward. Try again tomorrow!");
  }

  // prize now zero-based
  const prize = Math.floor(Math.random() * 6)+1; // 0 to 5

  user.swapCredits += (prize + 1);
  user.lastLuckyRoll = now;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, { prize, newCreditTotal: user.swapCredits }, `Congratulations! You won ${prize + 1} credits!`));
});

// A simple function to check if the daily reward is available
const getRewardStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const now = new Date();
    const lastRoll = user.lastLuckyRoll ? new Date(user.lastLuckyRoll) : null;
    const isAvailable = !lastRoll || now.toDateString() !== lastRoll.toDateString();

    return res.status(200).json(new ApiResponse(200, { isAvailable }, "Daily reward status fetched."));
});


export { claimDailyReward, getRewardStatus };
