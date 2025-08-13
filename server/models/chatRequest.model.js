import mongoose, { Schema } from 'mongoose';

const chatRequestSchema = new Schema({
    requester: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

chatRequestSchema.index({ requester: 1, receiver: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);
