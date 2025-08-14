import { Router } from 'express';
import {
    createTeam,
    joinTeam,
    getAllTeams,
    getTeamById,
    updateMeetingLink,
    addNote,
    sendTeamMessage,
    downloadNotesPDF,
    deleteTeam,
    removeMember,
    deleteNote,
    leaveTeam
} from '../controllers/team.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Route
router.route('/').get(getAllTeams);

// Apply JWT authentication to all subsequent routes
router.use(verifyJWT);

// Protected Routes
router.route('/').post(createTeam);

router.route('/:teamId')
    .get(getTeamById)
    .delete(deleteTeam);

router.route('/:teamId/join').post(joinTeam);
router.route('/:teamId/leave').post(leaveTeam);

router.route('/:teamId/meeting-link').patch(updateMeetingLink);
router.route('/:teamId/chat').post(sendTeamMessage);

router.route('/:teamId/members/:memberId').delete(removeMember);

router.route('/:teamId/notes').post(addNote);
router.route('/:teamId/notes/download').get(downloadNotesPDF);
router.route('/:teamId/notes/:noteId').delete(deleteNote);

export default router;
