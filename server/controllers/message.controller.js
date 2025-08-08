import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { getReceiverSocketId, io } from '../socket/socket.js';
import { User } from '../models/user.model.js';
import { Proposal } from '../models/proposal.model.js'; 
import profanity from 'leo-profanity'; 
import { sendPushNotification } from '../utils/pushNotifier.js';
profanity.loadDictionary(); 
profanity.add(profanity.getDictionary('hi'));
profanity.add(profanity.getDictionary('kn'));

const getMessages = asyncHandler(async (req, res) => {
	const { id: userToChatId } = req.params;
	const senderId = req.user._id;

	const conversation = await Conversation.findOne({
		participants: { $all: [senderId, userToChatId] },
	}).populate("messages");

	if (!conversation) {
		return res.status(200).json(new ApiResponse(200, [], "No messages found"));
	}

	const messages = conversation.messages;

	res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
});


const sendMessage = asyncHandler(async (req, res) => {
	const { message } = req.body;
	const { id: receiverId } = req.params;
	const senderId = req.user._id;

    if (profanity.check(message)) {
        throw new ApiError(400, "Message contains inappropriate language.");
    }

	let conversation = await Conversation.findOne({
		participants: { $all: [senderId, receiverId] },
	});

    if (!conversation) {
        const acceptedProposal = await Proposal.findOne({
            $or: [
                { proposer: senderId, receiver: receiverId, status: 'accepted' },
                { proposer: receiverId, receiver: senderId, status: 'accepted' }
            ]
        });

        if (!acceptedProposal) {
            throw new ApiError(403, "You can only chat with users you have an accepted swap with.");
        }

		conversation = await Conversation.create({
			participants: [senderId, receiverId],
		});
	}

	const newMessage = new Message({
        senderId,
        receiverId,
        message,
        conversationId: conversation._id
    });
	
    if (newMessage) {
		conversation.messages.push(newMessage._id);
        conversation.lastMessage = newMessage._id;
	}

	await Promise.all([conversation.save(), newMessage.save()]);

	const receiverSocketId = getReceiverSocketId(receiverId);
	if (receiverSocketId) {
		io.to(receiverSocketId).emit("newMessage", newMessage);
	}

  const pushPayload = {
    title: `New Message from ${req.user.username}`,
    body: message
  };
  await sendPushNotification(receiverId, pushPayload);

	res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));
});


const getConversations = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id;

    const conversations = await Conversation.find({ participants: loggedInUserId }).populate({
        path: 'participants',
        select: 'username profilePicture firstName lastName'
    }).populate('lastMessage');

    const conversationsWithUnreadCount = await Promise.all(conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(p => p && !p._id.equals(loggedInUserId));
        if (!otherParticipant) return null;

        const unreadCount = await Message.countDocuments({
            senderId: otherParticipant._id,
            receiverId: loggedInUserId,
            read: false
        });

        return {
            _id: conv._id,
            participant: otherParticipant,
            updatedAt: conv.updatedAt,
            lastMessage: conv.lastMessage,
            unreadCount: unreadCount 
        };
    }));

    const validConversations = conversationsWithUnreadCount.filter(conv => conv !== null);

    res.status(200).json(new ApiResponse(200, validConversations, "Conversations fetched successfully"));
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (!message.senderId.equals(userId)) {
        throw new ApiError(403, "You can only delete your own messages.");
    }

    const conversation = await Conversation.findOne({ messages: messageId });
    if (conversation) {
        await Conversation.updateOne({ _id: conversation._id }, { $pull: { messages: messageId } });
    }

    await Message.findByIdAndDelete(messageId);

    const otherParticipantId = conversation.participants.find(p => !p.equals(userId)).toString();
    const receiverSocketId = getReceiverSocketId(otherParticipantId);
	if (receiverSocketId) {
		io.to(receiverSocketId).emit("messageDeleted", { messageId, conversationId: conversation._id });
	}

    res.status(200).json(new ApiResponse(200, {}, "Message deleted successfully"));
});

const clearConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
        throw new ApiError(403, "You are not part of this conversation.");
    }

    await Message.deleteMany({ _id: { $in: conversation.messages } });

    conversation.messages = [];
    await conversation.save();
    
    res.status(200).json(new ApiResponse(200, {}, "Chat history cleared."));
});

const reportUser = asyncHandler(async (req, res) => {
    const { userIdToReport } = req.params;
    const reportingUser = req.user;

    const reportedUser = await User.findById(userIdToReport);
    if (!reportedUser) {
        throw new ApiError(404, "User to report not found.");
    }

    reportedUser.reportCount = (reportedUser.reportCount || 0) + 1;
    
    await reportedUser.save({ validateBeforeSave: false });

    const reportedUserSocketId = getReceiverSocketId(userIdToReport);

    if (reportedUser.reportCount >= 5) {
        await reportedUser.deleteOne(); 
        
        if (reportedUserSocketId) {
            io.to(reportedUserSocketId).emit('account_deleted', { message: "Your account has been deleted due to multiple reports of misconduct." });
        }
        console.log(`User ${reportedUser.username} deleted due to excessive reports.`);

    } else if (reportedUser.reportCount >= 2) {
        // Send a warning notification after the second report
        if (reportedUserSocketId) {
            io.to(reportedUserSocketId).emit('new_notification', { message: "Warning: Your account has received multiple reports for inappropriate behavior. Further violations may result in account termination." });
        }
    }

    return res.status(200).json(new ApiResponse(200, {}, "User has been reported."));
});


const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Message.updateMany(
        { receiverId: userId, read: false },
        { $set: { read: true } }
    );

    res.status(200).json(new ApiResponse(200, {}, "All messages marked as read."));
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { id: userToChatId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, userToChatId] }
    });

    if (conversation) {
        await Message.updateMany(
            { conversationId: conversation._id, receiverId: currentUserId, read: false },
            { $set: { read: true } }
        );
    }

    res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
});

export { sendMessage, getMessages, getConversations, deleteMessage, clearConversation, reportUser , markMessagesAsRead, markAllAsRead };
