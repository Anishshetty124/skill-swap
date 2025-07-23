import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Get the token from either the cookies or the Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user in the database based on the ID from the token
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      // This handles cases where the user might have been deleted but the token still exists
      throw new ApiError(401, "Invalid Access Token");
    }

    // Attach the user object to the request for use in subsequent controllers
    req.user = user;
    next(); 
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});