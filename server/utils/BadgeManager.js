import { Proposal } from '../models/proposal.model.js';
import { Skill } from '../models/skill.model.js';

export const calculateUserStats = async (user) => {
  const userId = user._id;

  const [skillsCount, completedSwaps] = await Promise.all([
    Skill.countDocuments({ user: userId, type: 'OFFER' }),
    Promise.resolve(user.swapsCompleted || 0),
  ]);

  const badges = new Set(user.badges || []);

  if (completedSwaps >= 1) badges.add('Swap Starter');
  if (completedSwaps >= 5) badges.add('Silver Swapper');
  if (completedSwaps >= 10) badges.add('Gold Swapper');
  if (completedSwaps >= 25) badges.add('Expert Swapper');

  if (skillsCount >= 1) badges.add('Skill Sharer');
  if (skillsCount >= 5) badges.add('Expert Sharer');

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  if (user.createdAt > twoDaysAgo) {
    badges.add('New Member');
  }

  return {
    earnedBadges: Array.from(badges),
    swapsCompleted: completedSwaps,
    skillsOfferedCount: skillsCount,
  };
};