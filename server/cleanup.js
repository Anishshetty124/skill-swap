import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Conversation } from './models/conversation.model.js';
import connectDB from './config/db.js';

dotenv.config({ path: './.env' });

const cleanupDuplicateConversations = async () => {
  try {
    await connectDB();
    console.log('Finding duplicate conversations...');

    const duplicates = await Conversation.aggregate([
      {
        $group: {
          _id: { participants: "$participants" },
          count: { $sum: 1 },
          docs: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { "$gt": 1 }
        }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('No duplicate conversations found.');
      return;
    }

    console.log(`Found ${duplicates.length} sets of duplicates. Cleaning up...`);
    let deletedCount = 0;

    for (const group of duplicates) {
      const [firstDoc, ...docsToDelete] = group.docs;
      const result = await Conversation.deleteMany({ _id: { $in: docsToDelete } });
      deletedCount += result.deletedCount;
    }

    console.log(`✅ Successfully deleted ${deletedCount} duplicate conversation(s).`);

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    mongoose.connection.close();
  }
};

cleanupDuplicateConversations();