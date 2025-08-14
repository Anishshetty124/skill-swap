import { Notification } from '../models/notification.model.js';

/**
 * @description Creates and saves a new notification to the database.
 * @param {string} userId - The ID of the user who will receive the notification.
 * @param {string} message - The content of the notification message.
 * @param {string} [url] - An optional URL for the notification to link to.
 */
export const createNotification = async (userId, message, url) => {
  try {
    if (!userId || !message) {
      throw new Error('User ID and message are required to create a notification.');
    }
    
    await Notification.create({
      user: userId,
      message: message,
      url: url,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
