import { User } from '../models/user.model.js';

export const cleanupUnverifiedUsers = async () => {
  console.log('Running daily cleanup job for unverified users...');
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lte: threeDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} unverified user(s).`);
    } else {
      console.log('No old, unverified users found to clean up.');
    }
  } catch (error) {
    console.error('Error during unverified user cleanup job:', error);
  }
};
