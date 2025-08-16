import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Skill } from '../models/skill.model.js';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { Report } from '../models/report.model.js';
import { createNotification } from './notification.controller.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { io, getReceiverSocketId } from '../socket/socket.js';

// --- Dashboard Stats ---
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalSkills = await Skill.countDocuments();
    const totalReports = await Report.countDocuments({ status: 'pending' });
    const totalConversations = await Conversation.countDocuments();

    res.status(200).json(new ApiResponse(200, { totalUsers, totalSkills, totalReports, totalConversations }, "Dashboard stats fetched."));
});

// --- User Management ---
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password -refreshToken').sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, users, "All users fetched."));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    // Add logic here to clean up user's data (skills, proposals, etc.) if needed
    await Skill.deleteMany({ user: userId });
    // ... other cleanup logic

    await user.deleteOne();
    res.status(200).json(new ApiResponse(200, {}, "User account deleted successfully."));
});

// --- Content Management ---
const getAllSkills = asyncHandler(async (req, res) => {
    const skills = await Skill.find({}).populate('user', 'username').sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, skills, "All skills fetched."));
});

// --- Communication ---
const getAllConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({})
        .populate('participants', 'username profilePicture')
        .populate('lastMessage')
        .sort({ 'lastMessage.createdAt': -1 });
    res.status(200).json(new ApiResponse(200, conversations, "All conversations fetched."));
});

const getMessagesForConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).populate('sender', 'username profilePicture').sort({ createdAt: 1 });
    res.status(200).json(new ApiResponse(200, messages, "Messages fetched."));
});

const sendCustomNotification = asyncHandler(async (req, res) => {
    const { userId, message, url } = req.body;
    if (!userId || !message) throw new ApiError(400, "User ID and message are required.");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    // 1. Create persistent notification
    await createNotification(userId, message, url || '/');

    // 2. Send real-time socket notification
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
        io.to(userSocketId).emit('new_notification', { message });
    }

    // 3. Send push notification
    const pushPayload = { title: 'A Message from skill4skill Admin', body: message, url: url || '/' };
    await sendPushNotification(userId, pushPayload);

    res.status(200).json(new ApiResponse(200, {}, "Custom notification sent successfully."));
});
const searchUsers = asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(200).json(new ApiResponse(200, [], "Query is required."));
    }
    const users = await User.find({
        username: { $regex: query, $options: 'i' }
    }).select('username email _id').limit(5);
    res.status(200).json(new ApiResponse(200, users, "Users found."));
});


// --- NEW: Report Management ---
const getReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ status: 'pending' })
        .populate('reporter', 'username')
        .populate('reportedUser', 'username')
        .populate('reportedSkill', 'title')
        .sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, reports, "Pending reports fetched."));
});

const updateReportStatus = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body; // Expecting 'resolved' or 'dismissed'

    if (!['resolved', 'dismissed'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) {
        throw new ApiError(404, "Report not found.");
    }
    res.status(200).json(new ApiResponse(200, report, "Report status updated."));
});


export {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    searchUsers, 
    getAllSkills,
    getAllConversations,
    getMessagesForConversation,
    sendCustomNotification,
    getReports, 
    updateReportStatus 
};
