import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ChatRequest } from '../models/chatRequest.model.js';
import { User } from '../models/user.model.js';
import { getReceiverSocketId, io } from '../socket/socket.js';
import { Conversation } from '../models/conversation.model.js';
import { sendPushNotification } from '../utils/pushNotifier.js';

const sendChatRequest = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const requesterId = req.user._id;

    if (requesterId.equals(receiverId)) {
        throw new ApiError(400, "You cannot send a chat request to yourself.");
    }

    const existingConversation = await Conversation.findOne({
        participants: { $all: [requesterId, receiverId] }
    });
    if (existingConversation) {
        throw new ApiError(400, "You are already connected with this user.");
    }

    const existingRequest = await ChatRequest.findOne({
        requester: requesterId,
        receiver: receiverId,
        status: { $in: ['pending', 'accepted'] }
    });
    if (existingRequest) {
        throw new ApiError(400, `You already have a ${existingRequest.status} request with this user.`);
    }

    await ChatRequest.create({ requester: requesterId, receiver: receiverId });

    const notificationMessage = `You have a new chat request from ${req.user.username}!`;

    // Send real-time socket notification
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_chat_request', {
            message: notificationMessage
        });
    }

    // Send push notification
    const pushPayload = {
        title: 'New Chat Request!',
        body: notificationMessage,
        url: '/dashboard'
    };
    await sendPushNotification(receiverId, pushPayload);

    return res.status(201).json(new ApiResponse(201, {}, "Chat request sent successfully."));
});

const getChatRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const requests = await ChatRequest.find({ receiver: userId, status: 'pending' })
        .populate('requester', 'username firstName lastName profilePicture');

    return res.status(200).json(new ApiResponse(200, requests, "Pending chat requests fetched."));
});

const respondToChatRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;
    const receiverId = req.user._id;

    if (!['accepted', 'rejected'].includes(status)) {
        throw new ApiError(400, "Invalid status. Must be 'accepted' or 'rejected'.");
    }

    const request = await ChatRequest.findById(requestId).populate('requester', 'username');
    if (!request) throw new ApiError(404, "Chat request not found.");
    if (!request.receiver.equals(receiverId)) throw new ApiError(403, "You are not authorized to respond to this request.");
    if (request.status !== 'pending') throw new ApiError(400, `This request has already been ${request.status}.`);

    request.status = status;
    await request.save();

    // --- New logic: Create conversation if accepted ---
    if (status === 'accepted') {
        const conversationExists = await Conversation.findOne({
            participants: { $all: [request.requester._id, receiverId] }
        });
        if (!conversationExists) {
            await Conversation.create({
                participants: [request.requester._id, receiverId]
            });
        }
    }

    // Send real-time socket notification to requester
    const requesterSocketId = getReceiverSocketId(request.requester._id.toString());
    if (requesterSocketId) {
        io.to(requesterSocketId).emit('new_notification', {
            message: `${req.user.username} has ${status} your chat request.`
        });
    }

    return res.status(200).json(new ApiResponse(200, request, `Chat request ${status}.`));
});

const archiveChatRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ChatRequest.findOneAndUpdate(
        { _id: requestId, $or: [{ requester: userId }, { receiver: userId }] },
        { $addToSet: { archivedBy: userId } }, // Add user to the archive list
        { new: true }
    );

    if (!request) {
        throw new ApiError(404, "Request not found or you are not authorized to modify it.");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Chat request dismissed."));
});

export { sendChatRequest, getChatRequests, respondToChatRequest, archiveChatRequest };
