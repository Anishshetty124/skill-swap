import mongoose, { Schema } from 'mongoose';

const teamMessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const noteSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const teamSchema = new Schema({
    skill: {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
        required: true,
        unique: true
    },
    instructor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxMembers: {
        type: Number,
        default: 10,
        min: 2
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'completed', 'pending_completion'], 
        default: 'open'
    },
    teamName: {
        type: String,
        trim: true
    },
    meetingLink: {
        type: String,
        trim: true
    },
    notes: [noteSchema],
    chat: [teamMessageSchema],
    completionConfirmedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

export const Team = mongoose.model('Team', teamSchema);
