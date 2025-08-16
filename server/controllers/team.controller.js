import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { io, getReceiverSocketId } from '../socket/socket.js';
import PDFDocument from 'pdfkit'; // Import pdfkit

const createTeam = asyncHandler(async (req, res) => {
    const { skillId, teamName, maxMembers } = req.body;
    const instructorId = req.user._id;

    const skill = await Skill.findById(skillId);
    if (!skill) throw new ApiError(404, "Skill not found.");
    if (!skill.user.equals(instructorId)) throw new ApiError(403, "You can only create a team for a skill you own.");
    if (skill.type !== 'OFFER') throw new ApiError(400, "Teams can only be created for skills being offered.");

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

    let team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (team.instructor.equals(userId)) throw new ApiError(400, "You cannot join a team you are instructing.");
    if (team.members.includes(userId)) throw new ApiError(400, "You are already a member of this team.");
    if (team.members.length >= team.maxMembers) throw new ApiError(400, "This team is already full.");

    team.members.push(userId);
    await team.save();

    team = await Team.findById(teamId)
        .populate('skill', 'title category')
        .populate('instructor', 'username firstName lastName profilePicture');

    return res.status(200).json(new ApiResponse(200, team, "Successfully joined the team."));
});

const getAllTeams = asyncHandler(async (req, res) => {
    const teams = await Team.find({ status: 'open' })
        .populate('skill', 'title category')
        .populate('instructor', 'username firstName lastName profilePicture');
        
    return res.status(200).json(new ApiResponse(200, teams, "Teams fetched successfully."));
});

const getTeamById = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
        .populate('skill', 'title description category')
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

    return res.status(201).json(new ApiResponse(201, populatedNote, "Note added successfully."));
});


const leaveTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");

    if (team.instructor.equals(userId)) {
        throw new ApiError(400, "Instructor cannot leave the team. You can delete it instead.");
    }

    const memberIndex = team.members.findIndex(memberId => memberId.equals(userId));
    if (memberIndex === -1) {
        throw new ApiError(400, "You are not a member of this team.");
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    return res.status(200).json(new ApiResponse(200, {}, "You have successfully left the team."));
});

const downloadNotesPDF = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId)
        .populate('notes.author', 'firstName lastName username')
        .populate('skill', 'title');

    if (!team) throw new ApiError(404, "Team not found.");

    const isMember = team.members.some(memberId => memberId.equals(userId));
    const isInstructor = team.instructor.equals(userId);

    if (!isMember && !isInstructor) {
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
            if (doc.y > 650) {
                doc.addPage();
            }
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

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(userId)) throw new ApiError(403, "Only the instructor can delete the team.");

    await Team.findByIdAndDelete(teamId);

    return res.status(200).json(new ApiResponse(200, {}, "Team deleted successfully."));
});


const removeMember = asyncHandler(async (req, res) => {
    const { teamId, memberId } = req.params;
    const instructorId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(instructorId)) throw new ApiError(403, "Only the instructor can remove members.");

    team.members.pull(memberId);
    await team.save();

    return res.status(200).json(new ApiResponse(200, { memberId }, "Member removed successfully."));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { teamId, noteId } = req.params;
    const instructorId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found.");
    if (!team.instructor.equals(instructorId)) throw new ApiError(403, "Only the instructor can delete notes.");

    // Pull the note from the sub-array
    team.notes.pull({ _id: noteId });
    await team.save();

    return res.status(200).json(new ApiResponse(200, { noteId }, "Note deleted successfully."));
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
    clearTeamChat
};
