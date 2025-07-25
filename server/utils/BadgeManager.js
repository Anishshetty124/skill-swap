import { Proposal } from '../models/proposal.model.js';
import { Skill } from '../models/skill.model.js';

export const calculateBadges = async (user) => {
    const userId = user._id;

    // Fetch necessary data to calculate achievements
    const [skillsCount, completedSwaps] = await Promise.all([
        Skill.countDocuments({ user: userId, type: 'OFFER' }),
        Proposal.countDocuments({ $or: [{ proposer: userId }, { receiver: userId }], status: 'accepted' })
    ]);

    const badges = new Set(user.badges || []);

    // Tiered Swapper Badges based on completed swaps
    if (completedSwaps >= 5) badges.add('Silver Swapper');
    if (completedSwaps >= 10) badges.add('Gold Swapper');
    if (completedSwaps >= 25) badges.add('Platinum Swapper');
    if (completedSwaps >= 50) badges.add('Pro Swapper');
    
    // Other milestone badges
    if (completedSwaps >= 1) badges.add('First Swap');
    if (skillsCount >= 1) badges.add('Skill Sharer');
    if (skillsCount >= 5) badges.add('Expert Sharer');
    
    // Time-based badge
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (user.createdAt > thirtyDaysAgo) {
        badges.add('New Member');
    }

    // Return all calculated data
    return {
        earnedBadges: Array.from(badges),
        swapsCompleted: completedSwaps,
        skillsOfferedCount: skillsCount
    };
};