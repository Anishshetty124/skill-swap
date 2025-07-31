import { Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, getUserProfile, updateUserProfile, updateUserAvatar, deleteUserAvatar, changePassword, updateAccountDetails } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// Secured Routes (must come before dynamic routes)
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/me").patch(verifyJWT, updateUserProfile);
router.route("/me/avatar").patch(verifyJWT, updateUserAvatar);
router.route("/me/avatar").delete(verifyJWT, deleteUserAvatar); 
router.route("/me/details").patch(verifyJWT, updateAccountDetails); 
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me/change-password").patch(verifyJWT, changePassword);
router.route("/:username").get(getUserProfile);

export default router;