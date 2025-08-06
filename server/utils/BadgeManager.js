import { Proposal } from '../models/proposal.model.js';
import { Skill } from '../models/skill.model.js';

export const calculateBadges = async (user) => {
    const userId = user._id;

    const [skillsCount, completedSwaps] = await Promise.all([
        Skill.countDocuments({ user: userId, type: 'OFFER' }),
        Proposal.countDocuments({ $or: [{ proposer: userId }, { receiver: userId }], status: 'accepted' })
    ]);

    const badges = new Set(user.badges || []);

    if (completedSwaps >= 5) badges.add('Silver Swapper');
    if (completedSwaps >= 10) badges.add('Gold Swapper');
    if (completedSwaps >= 25) badges.add('Platinum Swapper');
    if (completedSwaps >= 50) badges.add('Pro Swapper');
    
    if (completedSwaps >= 1) badges.add('First Swap');
    if (skillsCount >= 1) badges.add('Skill Sharer');
    if (skillsCount >= 5) badges.add('Expert Sharer');
    
    const TwoDayAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    if (user.createdAt > TwoDayAgo) {
        badges.add('New Member');
    }

    return {
        earnedBadges: Array.from(badges),
        swapsCompleted: completedSwaps,
        skillsOfferedCount: skillsCount
    };
};