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
  getLocationSuggestions,
  getKeywordSuggestions,
  getYoutubePlaceholders,
  getAllSkillsUnpaginated,
  getRecommendedSkills,
  generateSkillDescription
} from '../controllers/skill.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Public Routes ---
router.route('/all').get(getAllSkillsUnpaginated);
router.route('/keyword-suggestions').get(getKeywordSuggestions);
router.route('/locations').get(getLocationSuggestions);
router.route('/youtube-placeholders').get(getYoutubePlaceholders);
router.route('/nearby').get(getNearbySkills);
router.route('/').get(getAllSkills);

// --- Secured Routes ---
router.use(verifyJWT); // All routes below this line are protected

// Specific secured routes
router.route('/recommendations').get(getRecommendedSkills);
router.route('/generate-description').post(generateSkillDescription);
router.route('/').post(createSkill);

// Dynamic routes (public and secured) must be last
router.route('/:skillId').get(getSkillById); // Public GET for a single skill
router.route('/:skillId').patch(updateSkill).delete(deleteSkill); // Secured PATCH/DELETE
router.route('/:skillId/matches').get(getMatchingSkills);
router.route('/:skillId/bookmark').post(bookmarkSkill).delete(unbookmarkSkill);
router.route('/:skillId/rate').post(rateSkill);

export default router;