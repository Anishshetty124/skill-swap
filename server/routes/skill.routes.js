import { Router } from 'express';
import {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  getNearbySkills,
  getMatchingSkills,
  bookmarkSkill,
  unbookmarkSkill,
  rateSkill,
} from '../controllers/skill.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Routes --- (Anyone can view skills)
router.route('/').get(getAllSkills);
router.route('/nearby').get(getNearbySkills);
router.route('/:skillId').get(getSkillById);

// --- Secured Routes --- (Requires a logged-in user)
router.use(verifyJWT); // Middleware is applied to all routes defined BELOW this line

router.route('/').post(createSkill);
router.route('/:skillId').patch(updateSkill).delete(deleteSkill);
router.route('/:skillId/matches').get(getMatchingSkills);
router.route('/:skillId/bookmark').post(bookmarkSkill).delete(unbookmarkSkill);
router.route('/:skillId/rate').post(rateSkill); // Add this line

export default router;