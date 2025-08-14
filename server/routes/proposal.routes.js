import { Router } from 'express';
import {
  createProposal,
  getProposals,
  respondToProposal,
  updateContactInfo,
  completeSwap,
  deleteProposal
} from '../controllers/proposal.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
  .post(createProposal)
  .get(getProposals);

router.route("/:id")
  .delete(deleteProposal);

router.route('/:id/respond')
  .patch(respondToProposal);

router.route('/:id/contact')
  .patch(updateContactInfo);

router.route("/:id/complete").patch(completeSwap);

export default router;
