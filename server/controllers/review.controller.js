import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Review } from '../models/review.model.js';
import { Proposal } from '../models/proposal.model.js';

const createReview = asyncHandler(async (req, res) => {
  const { proposalId, rating, comment } = req.body;
  const reviewerId = req.user._id;

  const proposal = await Proposal.findById(proposalId);

  // 1. Validation Checks
  if (!proposal) throw new ApiError(404, 'Proposal not found.');
  if (proposal.status !== 'accepted') {
    throw new ApiError(400, 'Reviews can only be left for accepted proposals.');
  }

  // 2. Authorization Checks
  const isProposer = proposal.proposer.equals(reviewerId);
  const isReceiver = proposal.receiver.equals(reviewerId);

  if (!isProposer && !isReceiver) {
    throw new ApiError(403, 'You were not a part of this skill swap.');
  }

  // 3. Prevent Duplicate Reviews
  const existingReview = await Review.findOne({ proposal: proposalId, reviewer: reviewerId });
  if (existingReview) {
    throw new ApiError(409, 'You have already submitted a review for this swap.');
  }

  // 4. Determine who is being reviewed
  const revieweeId = isProposer ? proposal.receiver : proposal.proposer;

  // 5. Create the review
  const review = await Review.create({
    reviewer: reviewerId,
    reviewee: revieweeId,
    proposal: proposalId,
    rating,
    comment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, 'Thank you for your review!'));
});

export { createReview };