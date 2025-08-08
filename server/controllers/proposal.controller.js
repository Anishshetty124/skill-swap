import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Proposal } from '../models/proposal.model.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import { calculateBadges } from '../utils/BadgeManager.js';
import mongoose from 'mongoose';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

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

  io.to(receiverId.toString()).emit('new_notification', {
    message: `You have a new proposal from ${req.user.username}!`
  });

  return res.status(201).json(new ApiResponse(201, proposal, "Proposal sent successfully"));
});

const getProposals = asyncHandler(async (req, res) => {
  const { type = 'received' } = req.query;
  const userId = req.user._id;

  const query = type === 'sent'
    ? { proposer: userId }
    : { receiver: userId };

  const proposals = await Proposal.find(query)
    .populate({ path: 'proposer', select: 'username profilePicture' })
    .populate({ path: 'receiver', select: 'username profilePicture' })
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
    .populate('offeredSkill', 'title category');

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
      participants: { $all: [proposal.proposer, proposal.receiver] },
    });

    if (!conversation) {
      await Conversation.create({
        participants: [proposal.proposer, proposal.receiver],
      });
    }

    const proposerId = proposal.proposer.toString();
    const receiverId = proposal.receiver.toString();
    const receiverUsername = req.user.username;

    if (proposal.proposalType === 'credits') {
      const cost = proposal.costInCredits;
      await User.findByIdAndUpdate(proposal.proposer, { $inc: { swapCredits: -cost } });
      await User.findByIdAndUpdate(proposal.receiver, { $inc: { swapCredits: cost } });

      io.to(proposerId).emit('new_notification', {
        message: `Your proposal was accepted! You spent ${cost} credits.`
      });
      io.to(receiverId).emit('new_notification', {
        message: `You accepted the proposal and earned ${cost} credits!`
      });
    } else {
      io.to(proposerId).emit('new_notification', {
        message: `Your skill swap with ${receiverUsername} was accepted!`
      });
    }

    const skillsToUpdate = [proposal.requestedSkill._id];
    if (proposal.offeredSkill) {
      skillsToUpdate.push(proposal.offeredSkill._id);
    }
    await Skill.updateMany({ _id: { $in: skillsToUpdate } }, { $set: { status: 'in_progress' } });

    if (contactInfo && (contactInfo.phone || contactInfo.email || contactInfo.note)) {
      io.to(proposerId).emit('contact_info_received', {
        message: `${receiverUsername} has shared their contact details with you.`,
        details: contactInfo
      });
    }

    const usersInvolved = await User.find({ _id: { $in: [proposal.proposer, proposal.receiver] } });
    for (const user of usersInvolved) {
      const oldBadges = new Set(user.badges || []);
      const { earnedBadges } = await calculateBadges(user);
      const newBadges = new Set(earnedBadges);
      const newlyEarnedBadges = [...newBadges].filter(badge => !oldBadges.has(badge));

      if (newlyEarnedBadges.length > 0) {
        user.badges = earnedBadges;
        await user.save({ validateBeforeSave: false });
      newlyEarnedBadges.forEach(badgeName => {
          io.to(user._id.toString()).emit('new_badge_earned', {
            badgeName: badgeName
          });
        });
      }
    }
  }

  return res.status(200).json(new ApiResponse(200, proposal, `Proposal has been ${status}.`));
});

const deleteProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError(404, "Proposal not found");

  if (!proposal.proposer.equals(userId) && !proposal.receiver.equals(userId)) {
    throw new ApiError(403, "You are not authorized to delete this proposal.");
  }

     const otherUserId = proposal.proposer.equals(userId) 
    ? proposal.receiver.toString() 
    : proposal.proposer.toString();
  
  const otherUserSocketId = getReceiverSocketId(otherUserId);
  if (otherUserSocketId) {
    io.to(otherUserSocketId).emit('new_notification', { 
      message: `${req.user.username} has withdrawn their proposal.` 
    });
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [proposal.proposer, proposal.receiver] }
  });

  if (conversation) {
    await Message.deleteMany({ _id: { $in: conversation.messages } });
    await Conversation.findByIdAndDelete(conversation._id);
  }

  await Proposal.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "Proposal and associated chat deleted successfully"));
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

  io.to(otherUserId).emit('new_notification', {
    message: `${req.user.username} has updated the contact/meeting details for your swap.`
  });

  return res.status(200).json(new ApiResponse(200, proposal, "Contact information updated successfully."));
});

const completeSwap = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const proposal = await Proposal.findById(id).populate('proposer receiver');
  if (!proposal) throw new ApiError(404, "Proposal not found");

  if ((!proposal.proposer._id.equals(userId) && !proposal.receiver._id.equals(userId)) || proposal.status !== 'accepted') {
    throw new ApiError(403, "You are not authorized to complete this swap.");
  }

  proposal.status = 'completed';
  await proposal.save();

  const otherUser = proposal.proposer._id.equals(userId) ? proposal.receiver : proposal.proposer;
  const otherUserSocketId = getReceiverSocketId(otherUser._id.toString());
  if (otherUserSocketId) {
    io.to(otherUserSocketId).emit('new_notification', { 
      message: `${req.user.username} has marked your swap as complete!` 
    });
  }

  return res.status(200).json(new ApiResponse(200, proposal, "Swap marked as complete."));
});

export {
  createProposal,
  getProposals,
  respondToProposal,
  deleteProposal,
  updateContactInfo,
  completeSwap
};
