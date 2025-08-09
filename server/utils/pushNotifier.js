import webpush from 'web-push';
import { User } from '../models/user.model.js';

export const sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (user && user.pushSubscription) {
      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify(payload)
      );
    }
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.message);
  }
};