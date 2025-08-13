import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';

/**
 * @description Rate a user's profile with a like or dislike
 * @param {string} userIdToRate - The ID of the user to be rated
 * @param {string} action - The action to perform ('like' or 'dislike')
 */
const rateUserProfile = asyncHandler(async (req, res) => {
    const { userIdToRate } = req.params;
    const { action } = req.body; // 'like' or 'dislike'
    const raterId = req.user._id;

    if (!['like', 'dislike'].includes(action)) {
        throw new ApiError(400, "Invalid action. Must be 'like' or 'dislike'.");
    }

    // A user cannot rate their own profile
    if (raterId.equals(userIdToRate)) {
        throw new ApiError(400, "You cannot rate your own profile.");
    }

    const userToRate = await User.findById(userIdToRate);
    if (!userToRate) {
        throw new ApiError(404, "User not found.");
    }

    let message = '';

    if (action === 'like') {
        // A user cannot like and dislike at the same time, so remove any existing dislike
        userToRate.dislikes.pull(raterId);
        
        // Toggle the like status
        if (userToRate.likes.includes(raterId)) {
            userToRate.likes.pull(raterId); // Remove like
            message = 'Like removed.';
        } else {
            userToRate.likes.addToSet(raterId); // Add like (addToSet prevents duplicates)
            message = 'Profile liked.';
        }
    } else if (action === 'dislike') {
        // A user cannot like and dislike at the same time, so remove any existing like
        userToRate.likes.pull(raterId);

        // Toggle the dislike status
        if (userToRate.dislikes.includes(raterId)) {
            userToRate.dislikes.pull(raterId); // Remove dislike
            message = 'Dislike removed.';
        } else {
            userToRate.dislikes.addToSet(raterId); // Add dislike
            message = 'Profile disliked.';
        }
    }

    await userToRate.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {
        likes: userToRate.likes.length,
        dislikes: userToRate.dislikes.length
    }, message));
});

export { rateUserProfile };
