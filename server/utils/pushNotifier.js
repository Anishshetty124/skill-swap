import webpush from 'web-push';
import { User } from '../models/user.model.js';
import { ApiError } from './ApiError.js';

// Configure web-push with your VAPID keys from the .env file
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
};

// This setup is crucial for authenticating with push services
webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your admin email
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
        // Check if the user exists and has a saved push subscription
        if (!user || !user.pushSubscription) {
            console.log(`User ${userId} not found or has no push subscription.`);
            return;
        }

        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            data: {
                url: payload.url || '/', // Provide a default URL if none is specified
            },
        });

        // Send the notification
        await webpush.sendNotification(user.pushSubscription, notificationPayload);
        console.log(`Push notification sent successfully to user ${userId}`);

    } catch (error) {
        console.error(`Failed to send push notification to user ${userId}:`, error.message);
        
        // If the subscription is invalid (e.g., user unsubscribed), remove it from the database
        if (error.statusCode === 410 || error.statusCode === 404) {
            await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: "" } });
            console.log(`Removed invalid push subscription for user ${userId}`);
        }
    }
};

export { sendPushNotification };
