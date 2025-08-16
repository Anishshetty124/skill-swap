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
    leaveTeam,
    clearTeamChat,
    deleteTeamMessage,
    updateTeamDetails,
    initiateTeamClosure,
    confirmCompletion
} from '../controllers/team.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').post(createTeam).get(getAllTeams);
router.route('/:teamId').get(getTeamById).delete(deleteTeam);
router.route('/:teamId/join').post(joinTeam);
router.route('/:teamId/leave').post(leaveTeam);
router.route('/:teamId/meeting-link').patch(updateMeetingLink);
router.route('/:teamId/chat').post(sendTeamMessage);
router.route('/:teamId/chat').delete(clearTeamChat);
router.route('/:teamId/chat/:messageId').delete(deleteTeamMessage);
router.route('/:teamId/members/:memberId').delete(removeMember);
router.route('/:teamId/notes').post(addNote);
router.route('/:teamId/notes/download').get(downloadNotesPDF);
router.route('/:teamId/notes/:noteId').delete(deleteNote);
router.route("/:teamId/details").patch(updateTeamDetails);
router.route("/:teamId/initiate-closure").post(verifyJWT, initiateTeamClosure);
router.route("/:teamId/confirm-completion").post(verifyJWT, confirmCompletion)

export default router;
