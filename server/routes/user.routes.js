import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    getUserProfile, 
    updateUserProfile, 
    updateUserAvatar, 
    deleteUserAvatar, 
    updateAccountDetails,
    verifyOtp,
    resendVerificationEmail,
    forgotPassword, 
    resetPassword   
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
router.route("/me").get(getCurrentUser).patch(updateUserProfile);
router.route("/me/avatar").patch(updateUserAvatar).delete(deleteUserAvatar); 
router.route("/me/details").patch(updateAccountDetails); 

// This dynamic route must be last
router.route("/:username").get(getUserProfile);

export default router;
