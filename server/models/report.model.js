import mongoose, { Schema } from 'mongoose';

const reportSchema = new Schema({
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportType: {
        type: String,
        enum: ['user', 'skill'],
        required: true
    },
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: function() { return this.reportType === 'user'; } 
    },
    reportedSkill: {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
        required: function() { return this.reportType === 'skill'; }
    },
    // --- Common fields ---
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, { timestamps: true });

export const Report = mongoose.model('Report', reportSchema);
