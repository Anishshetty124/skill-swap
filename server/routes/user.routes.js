import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  updateUserAvatar
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// --- Public Routes ---
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/:username").get(getUserProfile);

// --- Secured Routes ---
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/me").patch(verifyJWT, updateUserProfile);
router.route("/me/avatar").patch(verifyJWT, updateUserAvatar);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;