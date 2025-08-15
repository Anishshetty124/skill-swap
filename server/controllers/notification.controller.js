import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Notification } from '../models/notification.model.js';
import { ApiError } from '../utils/ApiError.js'; // Import ApiError

/**
 * @description Create a new notification (Internal function, not a route handler)
 * @param {string} userId - The ID of the user to notify
 * @param {string} message - The notification message
 * @param {string} url - The URL the notification should link to
 */
const createNotification = async (userId, message, url) => {
    try {
        if (!userId || !message) {
            console.error("Cannot create notification: userId and message are required.");
            return;
        }
        await Notification.create({
            user: userId,
            message,
            url
        });
    } catch (error) {
        // This will help debug if the notification model fails to save
        console.error("Error creating notification in database:", error);
    }
};


/**
 * @description Get all notifications for the logged-in user
 */
const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully."));
});

/**
 * @description Mark all unread notifications as read for the logged-in user
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read."));
});

/**
 * @description Delete a single notification by its ID
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: notificationId, user: userId });
    if (!notification) {
        throw new ApiError(404, "Notification not found or you are not authorized to delete it.");
    }

    await notification.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Notification deleted."));
});


export { 
    getNotifications, 
    markAllAsRead, 
    deleteNotification,
    createNotification 
};
