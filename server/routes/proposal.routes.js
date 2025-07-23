import { Router } from 'express';
import { createProposal, getProposals, respondToProposal } from '../controllers/proposal.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all proposal routes
router.use(verifyJWT);

router.route('/').post(createProposal);

router.route('/').post(createProposal).get(getProposals); // 👈 Add GET
router.route('/:proposalId/respond').patch(respondToProposal); // 👈 Add this line

export default router;