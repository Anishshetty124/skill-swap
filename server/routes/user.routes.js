import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    getUserProfile, 
    updateUserAvatar, 
    deleteUserAvatar, 
    updateAccountDetails,
    verifyOtp,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    requestEmailChange,
    verifyEmailChange
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// --- Public Routes ---
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify-otp").post(verifyOtp);
router.route("/resend-verification").post(resendVerificationEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

// --- Secured Routes ---
router.use(verifyJWT);

router.route("/logout").post(logoutUser);

// This is now the single, unified route for fetching AND updating all profile/account info
router.route("/me")
  .get(getCurrentUser)
  .patch(updateAccountDetails);

router.route("/me/avatar").patch(updateUserAvatar).delete(deleteUserAvatar); 
router.route("/me/request-email-change").post(requestEmailChange);
router.route("/me/verify-email-change").post(verifyEmailChange);

// This dynamic route for public profiles must be last
router.route("/:username").get(getUserProfile);

export default router;
