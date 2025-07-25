import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Proposal } from '../models/proposal.model.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import { calculateBadges } from '../utils/BadgeManager.js';
import mongoose from 'mongoose';

const createProposal = asyncHandler(async (req, res) => {
  const { requestedSkillId, offeredSkillId, message } = req.body;
  const proposerId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(requestedSkillId) || !mongoose.Types.ObjectId.isValid(offeredSkillId)) {
    throw new ApiError(400, "Invalid skill ID format");
  }

  const requestedSkill = await Skill.findById(requestedSkillId);
  const offeredSkill = await Skill.findById(offeredSkillId);

  if (!requestedSkill || !offeredSkill) {
    throw new ApiError(404, "One or both skills not found");
  }

  const receiverId = requestedSkill.user;

  if (proposerId.equals(receiverId)) {
    throw new ApiError(400, "You cannot propose a swap with yourself.");
  }
  if (!offeredSkill.user.equals(proposerId)) {
    throw new ApiError(403, "You can only offer a skill that you own.");
  }

  const proposal = await Proposal.create({
    proposer: proposerId,
    receiver: receiverId,
    offeredSkill: offeredSkillId,
    requestedSkill: requestedSkillId,
    message,
  });

  if (!proposal) {
    throw new ApiError(500, "Failed to create the proposal");
  }

  const io = req.app.get('io');
  const receiverIdString = proposal.receiver.toString();
  
  io.to(receiverIdString).emit('new_notification', {
    message: `You have a new swap proposal from ${req.user.username}!`,
    proposalId: proposal._id
  });

  return res
    .status(201)
    .json(new ApiResponse(201, proposal, "Proposal sent successfully"));
});

const getProposals = asyncHandler(async (req, res) => {
  const { type = 'received' } = req.query;
  const userId = req.user._id;

  let query;
  if (type === 'sent') {
    query = { proposer: userId };
  } else {
    query = { receiver: userId };
  }

  const proposals = await Proposal.find(query)
    .populate({ path: 'proposer', select: 'username profilePicture' })
    .populate({ path: 'receiver', select: 'username profilePicture' })
    .populate({ path: 'offeredSkill', select: 'title category' })
    .populate({ path: 'requestedSkill', select: 'title category' })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, proposals, 'Proposals fetched successfully'));
});

const respondToProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, contactInfo } = req.body;
  const userId = req.user._id;

  if (!['accepted', 'rejected'].includes(status)) {
    throw new ApiError(400, "Invalid status.");
  }

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }

  if (!proposal.receiver.equals(userId)) {
    throw new ApiError(403, 'You are not authorized to respond to this proposal.');
  }

  if (proposal.status !== 'pending') {
    throw new ApiError(400, `This proposal has already been ${proposal.status}.`);
  }

  // Save the contact info if it exists
  if (status === 'accepted' && contactInfo) {
    proposal.contactInfo = contactInfo;
  }
  
  proposal.status = status;
  await proposal.save({ validateBeforeSave: false });
  
  if (status === 'accepted') {
    await Skill.updateMany(
      { _id: { $in: [proposal.offeredSkill, proposal.requestedSkill] } },
      { $set: { status: 'in_progress' } }
    );
    
    const io = req.app.get('io');
    const proposerId = proposal.proposer.toString();
    const receiverUsername = req.user.username;

    io.to(proposerId).emit('new_notification', {
        message: `Your proposal was accepted by ${receiverUsername}!`
    });
    
    if (contactInfo && (contactInfo.phone || contactInfo.note)) {
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
          io.to(user._id.toString()).emit('new_notification', {
            message: `Congratulations! You've earned the "${badgeName}" badge! 🎉`
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
  await Proposal.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "Proposal deleted successfully"));
});

export { createProposal, getProposals, respondToProposal, deleteProposal };