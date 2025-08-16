import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Proposal } from '../models/proposal.model.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import { calculateUserStats } from '../utils/BadgeManager.js';
import mongoose from 'mongoose';
import { Conversation } from '../models/conversation.model.js';
import { getReceiverSocketId, io } from '../socket/socket.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { createNotification } from '../utils/notificationManager.js';

const createProposal = asyncHandler(async (req, res) => {
  const { requestedSkillId, proposalType, offeredSkillId } = req.body;
  const proposerId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(requestedSkillId)) {
    throw new ApiError(400, "Invalid requested skill ID format");
  }

  const requestedSkill = await Skill.findById(requestedSkillId);
  if (!requestedSkill) throw new ApiError(404, "Requested skill not found");

  const receiverId = requestedSkill.user;
  if (proposerId.equals(receiverId)) {
    throw new ApiError(400, "You cannot propose a swap for your own skill.");
  }

  const proposalData = {
    proposer: proposerId,
    receiver: receiverId,
    requestedSkill: requestedSkillId,
    proposalType,
  };

  if (proposalType === 'skill') {
    if (!offeredSkillId) throw new ApiError(400, "An offered skill is required for this proposal type.");
    if (!mongoose.Types.ObjectId.isValid(offeredSkillId)) {
      throw new ApiError(400, "Invalid offered skill ID format");
    }
    const offeredSkill = await Skill.findById(offeredSkillId);
    if (!offeredSkill || !offeredSkill.user.equals(proposerId)) {
      throw new ApiError(403, "You can only offer a skill that you own.");
    }
    proposalData.offeredSkill = offeredSkillId;
  } else {
    const proposer = await User.findById(proposerId);
    if (proposer.swapCredits < requestedSkill.costInCredits) {
      throw new ApiError(400, "You do not have enough credits for this swap.");
    }
    proposalData.costInCredits = requestedSkill.costInCredits;
  }

  const proposal = await Proposal.create(proposalData);

  const notificationMessage = `You have a new proposal from ${req.user.username}!`;
  const notificationUrl = '/dashboard';

  const receiverSocketId = getReceiverSocketId(receiverId.toString());
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('new_notification', { message: notificationMessage });
  }
  await createNotification(receiverId, notificationMessage, notificationUrl);

  const pushPayload = {
    title: 'New skill4skill Proposal!',
    body: `You have a new proposal from ${req.user.username}.`,
    url: `${process.env.FRONTEND_URL}/dashboard`
  };
  await sendPushNotification(receiverId, pushPayload);

  return res.status(201).json(new ApiResponse(201, proposal, "Proposal sent successfully"));
});

const getProposals = asyncHandler(async (req, res) => {
  const { type = 'received' } = req.query;
  const userId = req.user._id;

  const query = type === 'sent'
    ? { proposer: userId }
    : { receiver: userId };

  const proposals = await Proposal.find(query)
    .populate({ path: 'proposer', select: 'username firstName lastName profilePicture' })
    .populate({ path: 'receiver', select: 'username firstName lastName profilePicture' })
    .populate({ path: 'requestedSkill', select: 'title category costInCredits type' })
    .populate({ path: 'offeredSkill', select: 'title category type' })
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, proposals, 'Proposals fetched successfully'));
});

const respondToProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, contactInfo } = req.body;
  const userId = req.user._id;

  if (!['accepted', 'rejected'].includes(status)) {
    throw new ApiError(400, "Invalid status.");
  }

  const proposal = await Proposal.findById(id)
    .populate('requestedSkill', 'title category costInCredits')
    .populate('offeredSkill', 'title category')
    .populate('proposer', 'username badges swapsCompleted')
    .populate('receiver', 'username badges swapsCompleted');

  if (!proposal) throw new ApiError(404, 'Proposal not found');
  if (!proposal.receiver.equals(userId)) throw new ApiError(403, 'You are not authorized to respond.');
  if (proposal.status !== 'pending') throw new ApiError(400, `This proposal has already been ${proposal.status}.`);

  if (status === 'accepted' && contactInfo) {
    proposal.contactInfo = contactInfo;
  }

  proposal.status = status;
  await proposal.save({ validateBeforeSave: false });

  if (status === 'accepted') {
    let conversation = await Conversation.findOne({
      participants: { $all: [proposal.proposer._id, proposal.receiver._id] },
    });

    if (!conversation) {
      await Conversation.create({
        participants: [proposal.proposer._id, proposal.receiver._id],
      });
    }

    const skillsToUpdate = [proposal.requestedSkill._id];
    if (proposal.offeredSkill) {
      skillsToUpdate.push(proposal.offeredSkill._id);
    }
    await Skill.updateMany({ _id: { $in: skillsToUpdate } }, { $set: { status: 'in_progress' } });

    if (contactInfo && (contactInfo.phone || contactInfo.email || contactInfo.note)) {
      io.to(proposal.proposer._id.toString()).emit('contact_info_received', {
        message: `${proposal.receiver.username} has shared their contact details with you.`,
        details: contactInfo
      });
    }

    const usersInvolved = await User.find({ _id: { $in: [proposal.proposer._id, proposal.receiver._id] } });

    for (const user of usersInvolved) {
      const oldBadges = new Set(user.badges || []);
      user.swapsCompleted = (user.swapsCompleted || 0) + 1;
      const { earnedBadges } = await calculateUserStats(user);
      const newBadges = new Set(earnedBadges);
      const newlyEarnedBadges = [...newBadges].filter(badge => !oldBadges.has(badge));

      if (newlyEarnedBadges.length > 0) {
        user.badges = earnedBadges;
        await user.save({ validateBeforeSave: false });
        newlyEarnedBadges.forEach(badgeName => {
          io.to(user._id.toString()).emit('new_badge_earned', { badgeName });
        });
      } else {
        await user.save({ validateBeforeSave: false });
      }
    }

    const notificationMessage = `${proposal.receiver.username} has accepted your proposal.`;
    const notificationUrl = '/dashboard';
    const proposerSocketId = getReceiverSocketId(proposal.proposer._id.toString());
    if (proposerSocketId) {
      io.to(proposerSocketId).emit('new_notification', { message: notificationMessage });
    }
    await createNotification(proposal.proposer._id, notificationMessage, notificationUrl);
  }

  return res.status(200).json(new ApiResponse(200, proposal, `Proposal has been ${status}.`));
});

const deleteProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const proposal = await Proposal.findOne({
    _id: id,
    $or: [{ proposer: userId }, { receiver: userId }]
  });

  if (!proposal) {
    throw new ApiError(404, "Proposal not found or you are not authorized to modify it.");
  }

  if (proposal.status === 'completed') {
    if (!proposal.archivedBy.includes(userId)) {
      proposal.archivedBy.push(userId);
      await proposal.save();
    }
    return res.status(200).json(new ApiResponse(200, {}, "Completed swap has been removed from your dashboard."));
  } else {
    await proposal.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Proposal has been permanently deleted."));
  }
});

const updateContactInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { contactInfo } = req.body;
  const userId = req.user._id;

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  if (!proposal.proposer.equals(userId) && !proposal.receiver.equals(userId)) {
    throw new ApiError(403, "You are not authorized to edit this information.");
  }

  if (proposal.status !== 'accepted') {
    throw new ApiError(400, "Contact info can only be edited for accepted proposals.");
  }

  proposal.contactInfo = contactInfo;
  await proposal.save({ validateBeforeSave: false });

  const otherUserId = proposal.proposer.equals(userId)
    ? proposal.receiver.toString()
    : proposal.proposer.toString();

  const notificationMessage = `${req.user.username} has updated the contact/meeting details for your swap.`;
  const notificationUrl = '/dashboard';
  const otherUserSocketId = getReceiverSocketId(otherUserId);
  if (otherUserSocketId) {
    io.to(otherUserSocketId).emit('new_notification', { message: notificationMessage });
  }
  await createNotification(otherUserId, notificationMessage, notificationUrl);

  return res.status(200).json(new ApiResponse(200, proposal, "Contact information updated successfully."));
});

const completeSwap = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const proposal = await Proposal.findById(id)
    .populate('proposer receiver')
    .populate('requestedSkill', 'title category costInCredits')
    .populate('offeredSkill', 'title category');

  if (!proposal) throw new ApiError(404, "Proposal not found");

  if ((!proposal.proposer._id.equals(userId) && !proposal.receiver._id.equals(userId)) || proposal.status !== 'accepted') {
    throw new ApiError(403, "This swap cannot be marked as complete.");
  }

  const completedByIds = proposal.completedBy.map(uid => uid.toString());
  if (!completedByIds.includes(userId.toString())) {
    proposal.completedBy.push(userId);
  }

  if (proposal.completedBy.length === 2) {
    proposal.status = 'completed';

    await User.findByIdAndUpdate(proposal.proposer._id, { $inc: { swapsCompleted: 1 } });
    await User.findByIdAndUpdate(proposal.receiver._id, { $inc: { swapsCompleted: 1 } });

    if (proposal.proposalType === 'credits') {
      const cost = proposal.costInCredits;
      await User.findByIdAndUpdate(proposal.proposer._id, { $inc: { swapCredits: -cost } });
      await User.findByIdAndUpdate(proposal.receiver._id, { $inc: { swapCredits: cost } });
    }

    const usersToUpdate = [proposal.proposer, proposal.receiver];
    for (const user of usersToUpdate) {
      const oldBadges = new Set(user.badges || []);
      user.swapsCompleted = (user.swapsCompleted || 0) + 1;
      const { earnedBadges } = await calculateUserStats(user);
      const newBadges = new Set(earnedBadges);
      const newlyEarnedBadges = [...newBadges].filter(badge => !oldBadges.has(badge));

      if (newlyEarnedBadges.length > 0) {
        user.badges = earnedBadges;
        newlyEarnedBadges.forEach(badgeName => {
          const badgeMessage = `Congratulations! You've earned the "${badgeName}" badge! 🎉`;
          const badgeUrl = `/profile/${user.username}`;
          const userSocketId = getReceiverSocketId(user._id.toString());
          if (userSocketId) {
            io.to(userSocketId).emit('new_notification', { message: badgeMessage });
          }
          createNotification(user._id, badgeMessage, badgeUrl);
        });
      }
      await user.save({ validateBeforeSave: false });
    }

    const proposerMessage = `Your swap with ${proposal.receiver.username} is now complete!`;
    const receiverMessage = `Your swap with ${proposal.proposer.username} is now complete!`;
    const proposerSocketId = getReceiverSocketId(proposal.proposer._id.toString());
    const receiverSocketId = getReceiverSocketId(proposal.receiver._id.toString());
    if (proposerSocketId) io.to(proposerSocketId).emit('new_notification', { message: proposerMessage });
    if (receiverSocketId) io.to(receiverSocketId).emit('new_notification', { message: receiverMessage });
    await createNotification(proposal.proposer._id, proposerMessage, '/dashboard');
    await createNotification(proposal.receiver._id, receiverMessage, '/dashboard');

  } else {
    const otherUser = proposal.proposer._id.equals(userId) ? proposal.receiver : proposal.proposer;
    const notificationMessage = `${req.user.username} has marked your swap as complete. Please confirm to finalize.`;
    const notificationUrl = '/dashboard';
    const otherUserSocketId = getReceiverSocketId(otherUser._id.toString());
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit('new_notification', { message: notificationMessage });
    }
    await createNotification(otherUser._id, notificationMessage, notificationUrl);
  }

  await proposal.save();
  return res.status(200).json(new ApiResponse(200, proposal, "Swap completion status updated."));
});

export {
  createProposal,
  getProposals,
  respondToProposal,
  deleteProposal,
  updateContactInfo,
  completeSwap
};
