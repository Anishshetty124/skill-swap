import { Router } from 'express';
import {
  createProposal,
  getProposals,
  respondToProposal,
  withdrawProposal,
} from '../controllers/proposal.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').post(createProposal).get(getProposals);
router.route('/:id/respond').patch(respondToProposal);
router.route('/:id').delete(withdrawProposal);

export default router;