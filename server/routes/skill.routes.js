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
  generateAiContent,
  getRecommendedSkills
} from '../controllers/skill.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// --- PUBLIC ROUTES ---
// All specific, non-dynamic routes must come first.
router.route('/all').get(getAllSkillsUnpaginated);
router.route('/keyword-suggestions').get(getKeywordSuggestions);
router.route('/locations').get(getLocationSuggestions);
router.route('/youtube-placeholders').get(getYoutubePlaceholders);
router.route('/nearby').get(getNearbySkills);
router.route('/').get(getAllSkills);

// --- SECURED ROUTES ---
router.use(verifyJWT);

// Specific secured routes must come before any dynamic routes.
router.route('/ai-generate').post(generateAiContent);
router.route('/recommendations').get(getRecommendedSkills);
router.route('/').post(createSkill);


// --- DYNAMIC ROUTES (MUST BE LAST) ---
router.route('/:skillId')
  .get(getSkillById) // Public GET for a single skill
  .patch(updateSkill) // Secured PATCH
  .delete(deleteSkill); // Secured DELETE

router.route('/:skillId/matches').get(getMatchingSkills);
router.route('/:skillId/bookmark').post(bookmarkSkill).delete(unbookmarkSkill);
router.route('/:skillId/rate').post(rateSkill);

export default router;
