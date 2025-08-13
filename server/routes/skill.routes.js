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
  getYoutubeTutorials,
  getYoutubePlaceholders,
  getAllSkillsUnpaginated,
  generateAiContent,
  getRecommendedSkills,
  checkKeywordSafety,
  reportSkill
} from '../controllers/skill.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/all').get(getAllSkillsUnpaginated);
router.route('/keyword-suggestions').get(getKeywordSuggestions);
router.route('/locations').get(getLocationSuggestions);
router.route("/check-safety").post(checkKeywordSafety);
router.route('/youtube-tutorials').get(getYoutubeTutorials);
router.route('/youtube-placeholders').get(getYoutubePlaceholders);
router.route('/nearby').get(getNearbySkills);
router.route('/').get(getAllSkills);

router.use(verifyJWT);

router.route('/ai-generate').post(generateAiContent);
router.route('/recommendations').get(getRecommendedSkills);
router.route('/').post(createSkill);


router.route('/:skillId')
  .get(getSkillById) 
  .patch(updateSkill)
  .delete(deleteSkill); 

router.route('/:skillId/matches').get(getMatchingSkills);
router.route('/:skillId/bookmark').post(bookmarkSkill).delete(unbookmarkSkill);
router.route('/:skillId/rate').post(rateSkill);
router.route('/:skillId/report').post(reportSkill);

export default router;