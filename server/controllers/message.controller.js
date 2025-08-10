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
    body: message,
    url: '/messages'
  };
  await sendPushNotification(receiverId, pushPayload);

	res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));
});


const getConversations = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id;

    const conversations = await Conversation.aggregate([
        // Stage 1: Find all conversations the current user is a part of
        { $match: { participants: loggedInUserId } },

        // Stage 2: Get the details of the other participant
        {
            $lookup: {
                from: 'users',
                localField: 'participants',
                foreignField: '_id',
                as: 'participantDetails'
            }
        },

        // Stage 3: Get the details of the last message
        {
            $lookup: {
                from: 'messages',
                localField: 'lastMessage',
                foreignField: '_id',
                as: 'lastMessageDetails'
            }
        },

        // Stage 4: Reshape the data for the frontend
        {
            $project: {
                _id: 1,
                updatedAt: 1,
                participant: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$participantDetails",
                                as: "p",
                                cond: { $ne: ["$$p._id", loggedInUserId] }
                            }
                        },
                        0
                    ]
                },
                lastMessage: { $arrayElemAt: ["$lastMessageDetails", 0] }
            }
        },

        // Stage 5: Calculate the unread count for each conversation
        {
            $lookup: {
                from: 'messages',
                let: { conversationId: "$_id", participantId: "$participant._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$conversationId", "$$conversationId"] },
                                    { $eq: ["$senderId", "$$participantId"] },
                                    { $eq: ["$receiverId", loggedInUserId] },
                                    { $eq: ["$read", false] }
                                ]
                            }
                        }
                    },
                    { $count: "unread" }
                ],
                as: "unreadMessages"
            }
        },

        // Stage 6: Final formatting
        {
            $project: {
                _id: 1,
                updatedAt: 1,
                participant: {
                    _id: "$participant._id",
                    username: "$participant.username",
                    profilePicture: "$participant.profilePicture",
                    firstName: "$participant.firstName",
                    lastName: "$participant.lastName"
                },
                lastMessage: 1,
                unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadMessages.unread", 0] }, 0] }
            }
        },

        // Stage 7: Sort by the most recent conversation
        { $sort: { updatedAt: -1 } }
    ]);

    res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched successfully"));
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

    const updatedUser = await User.findByIdAndUpdate(
        userIdToReport,
        { $inc: { reportCount: 1 } },
        { new: true }
    );

    if (!updatedUser) {
        throw new ApiError(404, "User to report not found.");
    }

    const reportedUserSocketId = getReceiverSocketId(userIdToReport);

    if (updatedUser.reportCount >= 5) {
        await updatedUser.deleteOne(); 
        
        if (reportedUserSocketId) {
            io.to(reportedUserSocketId).emit('account_deleted', { message: "Your account has been deleted due to multiple reports of misconduct." });
        }
        console.log(`User ${updatedUser.username} deleted due to excessive reports.`);

    } else if (updatedUser.reportCount >= 2) {
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

  const conversationExists = await Conversation.exists({
    participants: { $all: [currentUserId, userToChatId] }
  });

  if (conversationExists) {
    await Message.updateMany(
      { senderId: userToChatId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );
    return res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
  } else {
    return res.status(404).json(new ApiResponse(404, {}, "Conversation not found"));
  }
});

const deleteConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
        throw new ApiError(403, "You are not authorized to delete this conversation.");
    }

    await Message.deleteMany({ _id: { $in: conversation.messages } });

    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json(new ApiResponse(200, {}, "Conversation deleted successfully."));
});


export { sendMessage, getMessages, getConversations, deleteMessage, clearConversation, reportUser , markMessagesAsRead, markAllAsRead, deleteConversation };
