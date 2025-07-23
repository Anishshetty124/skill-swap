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

// --- Secured Routes --- (Must come BEFORE dynamic routes like /:username)
router.route("/me").get(verifyJWT, getCurrentUser); 
router.route("/me").patch(verifyJWT, updateUserProfile);
router.route("/me/avatar").patch(verifyJWT, updateUserAvatar);
router.route("/logout").post(verifyJWT, logoutUser);

// --- Dynamic Public Route --- (This must be last)
// Any route with a variable like :username must come after specific routes like /me
router.route("/:username").get(getUserProfile);

export default router;