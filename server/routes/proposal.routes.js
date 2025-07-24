import { Router } from 'express';
import {
  createProposal,
  deleteProposal,
  getProposals,
  respondToProposal,
} from '../controllers/proposal.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').post(createProposal).get(getProposals);
router.route('/:id/respond').patch(respondToProposal);
router.route('/:id').delete(deleteProposal);
export default router;