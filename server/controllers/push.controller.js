import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:anishshetty124@gmail.com', 
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * @description Subscribe a user to push notifications
 * @route POST /api/v1/push/subscribe
 * @access Private
 */
const subscribeToPushNotifications = asyncHandler(async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user._id;

  if (!subscription) {
    throw new ApiError(400, "Push subscription object is required.");
  }

  await User.findByIdAndUpdate(userId, {
    $set: { pushSubscription: subscription }
  });

  res.status(201).json(new ApiResponse(201, {}, "Successfully subscribed to push notifications."));
});

export { subscribeToPushNotifications };
