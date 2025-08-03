import { Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, getUserProfile, updateUserProfile, updateUserAvatar, deleteUserAvatar, changePassword, updateAccountDetails, verifyOtp, resendVerificationEmail } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify-otp").post(verifyOtp);
router.route("/resend-verification").post(resendVerificationEmail);

// Secured Routes
router.use(verifyJWT);
router.route("/logout").post(logoutUser);
router.route("/me").get(getCurrentUser).patch(updateUserProfile);
router.route("/me/avatar").patch(updateUserAvatar).delete(deleteUserAvatar); 
router.route("/me/details").patch(updateAccountDetails); 
router.route("/me/change-password").patch(changePassword);

// Dynamic Public Route (must be last)  
router.route("/:username").get(getUserProfile);

export default router;
