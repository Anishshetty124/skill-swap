import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const isAdmin = asyncHandler(async (req, _, next) => {
    
    if (!req.user) {
        throw new ApiError(401, "User not authenticated.");
    }

    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access denied. You do not have admin privileges.");
    }

    next();
});

export { isAdmin };
