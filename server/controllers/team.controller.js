import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { io, getReceiverSocketId } from '../socket/socket.js';
import PDFDocument from 'pdfkit';

const createTeam = asyncHandler(async (req, res) => {
    const { skillId, teamName, maxMembers, costInCredits } = req.body;
    const instructorId = req.user._id;
    const skill = await Skill.findById(skillId);
    if (!skill) throw new ApiError(404, "Skill not found.");
    if (!skill.user.equals(instructorId)) throw new ApiError(403, "You can only create a team for a skill you own.");
    if (skill.type !== 'OFFER') throw new ApiError(400, "Teams can only be created for skills being offered.");
    const existingTeam = await Team.findOne({ skill: skillId });
    if (existingTeam) {
        throw new ApiError(400, "A team for this skill already exists.");
    }
    if (costInCredits !== undefined && skill.costInCredits !== costInCredits) {
        skill.costInCredits = costInCredits;
        await skill.save();
    }
    const newTeam = await Team.create({
        skill: skillId,
        instructor: instructorId,
        teamName: teamName || `${skill.title} Team`,
        maxMembers: maxMembers || 10
    });
    return res.status(201).json(new ApiResponse(201, newTeam, "Team created successfully."));
});

const joinTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const teamForCostCheck = await Team.findById(teamId).populate('skill', 'costInCredits');
    if (!teamForCostCheck) throw new ApiError(404, "Team not found.");
    if (teamForCostCheck.instructor.equals(userId)) throw new ApiError(400, "You cannot join a team you are instructing.");
    const user = await User.findById(userId);
    const cost = teamForCostCheck.skill.costInCredits || 0;
    if (user.swapCredits < cost) {
        throw new ApiError(400, `You need ${cost} credits to join this team, but you only have ${user.swapCredits}.`);
    }
    user.swapCredits -= cost;
    await user.save();
    const updatedTeam = await Team.findOneAndUpdate(
        {
            _id: teamId,
            members: { $ne: userId },
            $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] }
        },
        { $push: { members: userId } },
        { new: true }
    ).populate('skill', 'title category').populate('instructor', 'username firstName lastName profilePicture');
    if (!updatedTeam) {
        user.swapCredits += cost;
        await user.save();
        throw new ApiError(400, "Team is full, you are already a member, or the team does not exist.");
    }
    return res.status(200).json(new ApiResponse(200, updatedTeam, "Successfully joined the team."));
});

const getAllTeams = asyncHandler(async (req, res) => {
    const teams = await Team.find({ status: { $in: ['open', 'pending_completion'] } })
       .populate('skill', 'title category costInCredits')
        .populate('instructor', 'username firstName lastName profilePicture');
    return res.status(200).json(new ApiResponse(200, teams, "Teams fetched successfully."));
});

const getTeamById = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
        .populate('skill', 'title description category costInCredits')
        .populate('instructor', 'username firstName lastName profilePicture')
        .populate('members', 'username firstName lastName profilePicture')
        .populate('notes.author', 'username firstName lastName profilePicture')
        .populate('chat.sender', 'username firstName lastName profilePicture');
    if (!team) throw new ApiError(404, "Team not found.");
    const isMember = team.members.some(member => member._id.equals(req.user._id));
    if (!team.instructor._id.equals(req.user._id) && !isMember) {
        throw new ApiError(403, "You are not a member of this team.");
    }
    return res.status(200).json(new ApiResponse(200, team, "Team details fetched successfully."));
});

const updateMeetingLink = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { meetingLink } = req.body;
    const userId = req.user._id;
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can update the meeting link.");
    team.meetingLink = meetingLink;
    await team.save();
    return res.status(200).json(new ApiResponse(200, { meetingLink }, "Meeting link updated."));
});

const addNote = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    let team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can add notes.");
    const newNote = { author: userId, content };
    team.notes.push(newNote);
    await team.save();
    await team.populate('notes.author', 'username firstName lastName profilePicture');
    const populatedNote = team.notes[team.notes.length - 1];
    const teamRoom = `team_${teamId}`;
    io.to(teamRoom).emit('new_team_note', populatedNote);
    return res.status(201).json(new ApiResponse(201, populatedNote, "Note added successfully."));
});

const leaveTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId).populate('skill', 'costInCredits');
    if (!team) throw new ApiError(404, "Team not found.");
    if (team.instructor.equals(userId)) throw new ApiError(400, "Instructor cannot leave. You can delete the team instead.");
    if (!team.members.some(memberId => memberId.equals(userId))) {
        throw new ApiError(400, "You are not a member of this team.");
    }
    const cost = team.skill.costInCredits || 0;
    if (cost > 0) {
        await User.findByIdAndUpdate(userId, { $inc: { swapCredits: cost } });
    }
    team.members.pull(userId);
    await team.save();
    return res.status(200).json(new ApiResponse(200, {}, "You have left the team and your credits have been refunded."));
});

const downloadNotesPDF = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId)
        .populate('notes.author', 'firstName lastName username')
        .populate('skill', 'title');
    if (!team) throw new ApiError(404, "Team not found.");
    const isMember = team.members.some(memberId => memberId.equals(userId));
    if (!team.instructor.equals(userId) && !isMember) {
        throw new ApiError(403, "You must be a member of the team to download notes.");
    }
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `notes_${team.teamName.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);
    doc.fontSize(20).text(`Notes for ${team.teamName}`, { align: 'center' });
    doc.fontSize(14).text(`Skill: ${team.skill.title}`, { align: 'center' });
    doc.moveDown(2);
    if (team.notes && team.notes.length > 0) {
        team.notes.forEach(note => {
            const authorName = `${note.author.firstName} ${note.author.lastName} (@${note.author.username})`;
            const noteDate = new Date(note.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            doc.fontSize(12).font('Helvetica-Bold').text(`Author: ${authorName}`);
            doc.fontSize(10).font('Helvetica').fillColor('grey').text(`Date: ${noteDate}`);
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica').fillColor('black').text(note.content, { align: 'justify' });
            doc.moveDown(1.5);
            if (doc.y > 650) doc.addPage();
        });
    } else {
        doc.fontSize(12).text('No notes have been added to this team yet.', { align: 'center' });
    }
    doc.end();
});

const sendTeamMessage = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;
    let team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    const isMember = team.members.some(member => member.equals(senderId));
    if (!team.instructor.equals(senderId) && !isMember) {
        throw new ApiError(403, "You must be a member to send messages in this team chat.");
    }
    const newMessage = { sender: senderId, message };
    team.chat.push(newMessage);
    await team.save();
    await team.populate('chat.sender', 'username firstName lastName profilePicture');
    const populatedMessage = team.chat[team.chat.length - 1];
    const teamRoom = `team_${teamId}`;
    io.to(teamRoom).emit('new_team_message', populatedMessage);
    return res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent."));
});

const clearTeamChat = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can clear the chat.");
    team.chat = [];
    await team.save();
    const teamRoom = `team_${teamId}`;
    io.to(teamRoom).emit('team_chat_cleared');
    return res.status(200).json(new ApiResponse(200, {}, "Team chat cleared successfully."));
});

const deleteTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId).populate('skill', 'costInCredits');
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can delete the team.");
    const cost = team.skill.costInCredits || 0;
    if (cost > 0 && team.members.length > 0) {
        await User.updateMany({ _id: { $in: team.members } }, { $inc: { swapCredits: cost } });
    }
    await Team.findByIdAndDelete(teamId);
    return res.status(200).json(new ApiResponse(200, {}, "Team deleted and credits refunded to members."));
});

const removeMember = asyncHandler(async (req, res) => {
    const { teamId, memberId } = req.params;
    const instructorId = req.user._id;
    const team = await Team.findById(teamId).populate('skill', 'costInCredits');
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(instructorId)) throw new ApiError(403, "Only the instructor can remove members.");
    const cost = team.skill.costInCredits || 0;
    if (cost > 0) {
        await User.findByIdAndUpdate(memberId, { $inc: { swapCredits: cost } });
    }
    team.members.pull(memberId);
    await team.save();
    return res.status(200).json(new ApiResponse(200, { memberId }, "Member removed and credits refunded."));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { teamId, noteId } = req.params;
    const instructorId = req.user._id;
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(instructorId)) throw new ApiError(403, "Only the instructor can delete notes.");
    team.notes.pull({ _id: noteId });
    await team.save();
    return res.status(200).json(new ApiResponse(200, { noteId }, "Note deleted successfully."));
});

const deleteTeamMessage = asyncHandler(async (req, res) => {
    const { teamId, messageId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    const message = team.chat.id(messageId);
    if (!message) throw new ApiError(404, "Message not found in this team.");
    const isInstructor = team.instructor.equals(userId);
    const isSender = message.sender.equals(userId);
    if (!isInstructor && !isSender) {
        throw new ApiError(403, "You are not authorized to delete this message.");
    }
    team.chat.pull({ _id: messageId });
    await team.save();
    const teamRoom = `team_${teamId}`;
    io.to(teamRoom).emit('team_message_deleted', { messageId });
    return res.status(200).json(new ApiResponse(200, {}, "Message deleted successfully."));
});

const updateTeamDetails = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { teamName, maxMembers } = req.body;
    const userId = req.user._id;
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can update team details.");
    if (teamName) team.teamName = teamName;
    if (maxMembers) team.maxMembers = maxMembers;
    await team.save();
    const teamRoom = `team_${teamId}`;
    io.to(teamRoom).emit('team_details_updated', { teamName: team.teamName, maxMembers: team.maxMembers });
    return res.status(200).json(new ApiResponse(200, team, "Team details updated."));
});

const initiateTeamClosure = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can initiate team closure.");
    if (team.status !== 'open') throw new ApiError(400, "Team is not open for closure.");
    team.status = 'pending_completion';
    await team.save();
    const teamRoom = `team_${teamId}`;
    io.to(teamRoom).emit('team_closure_initiated');
    return res.status(200).json(new ApiResponse(200, team, "Team closure process initiated."));
});

const confirmCompletion = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await Team.findById(teamId).populate('skill', 'costInCredits');
    if (!team) throw new ApiError(404, "Team not found.");
    if (team.status !== 'pending_completion') throw new ApiError(400, "Team is not pending completion.");
    if (!team.members.some(memberId => memberId.equals(userId))) {
        throw new ApiError(403, "Only team members can confirm completion.");
    }
    if (team.completionConfirmedBy.includes(userId)) {
        throw new ApiError(400, "You have already confirmed completion.");
    }
    team.completionConfirmedBy.push(userId);
    const majorityCount = Math.ceil(team.members.length / 2);
    if (team.completionConfirmedBy.length >= majorityCount) {
        team.status = 'completed';
        const costPerMember = team.skill.costInCredits || 0;
        const totalCreditsAwarded = team.members.length * costPerMember;
        if (totalCreditsAwarded > 0) {
            await User.findByIdAndUpdate(team.instructor, { $inc: { swapCredits: totalCreditsAwarded } });
        }
        const teamRoom = `team_${teamId}`;
        io.to(teamRoom).emit('team_closed', { message: `The team has been marked as complete. ${totalCreditsAwarded} credits awarded to the instructor.` });
    }
    await team.save();
    return res.status(200).json(new ApiResponse(200, team, "Completion confirmed."));
});

export { 
    createTeam, 
    joinTeam, 
    getAllTeams,
    getTeamById,
    updateMeetingLink,
    addNote,
    sendTeamMessage,
    deleteTeam,
    leaveTeam,
    downloadNotesPDF,
    removeMember, 
    deleteNote,
    clearTeamChat,
    deleteTeamMessage,
    updateTeamDetails,
    initiateTeamClosure,
    confirmCompletion
};
