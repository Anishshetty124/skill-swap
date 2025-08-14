import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Notification } from '../models/notification.model.js';

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


export { getNotifications, markAllAsRead, deleteNotification };
