import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
  { conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
        type: Boolean,
        default: false,
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
