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
  verifyEmailChange,
  getLeaderboard,
  searchUsers,
  getChatStatus,
  healthCheck
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/test").get((req, res) => {
  res.send("User router is working!");
});

// ----------- PUBLIC ROUTES -----------
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/search").get(searchUsers);
router.route("/leaderboard").get(getLeaderboard);
router.route("/verify-otp").post(verifyOtp);
router.route("/resend-verification").post(resendVerificationEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

// ----------- PROTECTED ROUTES -----------
router.use(verifyJWT);

router.route("/logout").post(logoutUser);

router.route("/me")
  .get(getCurrentUser)
  .patch(updateAccountDetails);

router.route("/me/avatar")
  .patch(updateUserAvatar)
  .delete(deleteUserAvatar);

router.route("/me/request-email-change").post(requestEmailChange);
router.route("/me/verify-email-change").post(verifyEmailChange);
router.route("/:profileId/chat-status").get(verifyJWT, getChatStatus);
router.route("/health").get(healthCheck);
router.route("/:username").get(getUserProfile);

export default router;
