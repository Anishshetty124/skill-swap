import webpush from 'web-push';
import { User } from '../models/user.model.js';
import { ApiError } from './ApiError.js';

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
    'mailto:anishshetty124@gmail.com', 
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

/**
 * Sends a push notification to a specific user.
 * @param {string} userId - The ID of the user to send the notification to.
 * @param {object} payload - The notification content.
 * @param {string} payload.title - The title of the notification.
 * @param {string} payload.body - The main text of the notification.
 * @param {string} [payload.url] - An optional URL to open when the notification is clicked.
 */
const sendPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscription) {
            console.log(`User ${userId} not found or has no push subscription.`);
            return;
        }

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/",
        });


        await webpush.sendNotification(user.pushSubscription, notificationPayload);
        console.log(`Push notification sent successfully to user ${userId}`);

    } catch (error) {
        console.error(`Failed to send push notification to user ${userId}:`, error.message);
        
        if (error.statusCode === 410 || error.statusCode === 404) {
            await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: "" } });
            console.log(`Removed invalid push subscription for user ${userId}`);
        }
    }
};

export { sendPushNotification };
