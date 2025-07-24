import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import natural from 'natural';
import opencage from 'opencage-api-client';

const { WordTokenizer, TfIdf } = natural;

const generateTags = (text) => {
  const tokenizer = new WordTokenizer();
  const tfidf = new TfIdf();
  tfidf.addDocument(text.toLowerCase());
  return tfidf.listTerms(0).slice(0, 5).map(item => item.term);
};

const createSkill = asyncHandler(async (req, res) => {
  const { type, title, description, category, level, availability, locationString } = req.body;
  if (!type || !title || !description || !category) {
    throw new ApiError(400, 'Type, title, description, and category are required');
  }
  const tags = generateTags(`${title} ${description}`);
  const skillData = { user: req.user._id, type, title, description, category, level, availability, tags, locationString };

  if (locationString && locationString.toLowerCase() !== 'remote') {
    try {
      const geoData = await opencage.geocode({ q: locationString, limit: 1, key: process.env.OPENCAGE_API_KEY });
      if (geoData.results.length > 0) {
        const { lng, lat } = geoData.results[0].geometry;
        skillData.geoCoordinates = { type: 'Point', coordinates: [lng, lat] };
      }
    } catch (error) {
      console.error("Geocoding failed for skill:", error.message);
    }
  }
  const skill = await Skill.create(skillData);
  return res.status(201).json(new ApiResponse(201, skill, 'Skill posted successfully'));
});

const getAllSkills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, category, keywords, userId } = req.query;
  const query = {};

  if (type) query.type = type;
  if (category) query.category = category;
  if (keywords) query.$text = { $search: keywords };
  if (userId) query.user = userId;

  const skills = await Skill.find(query)
    .populate({ path: 'user', select: 'username profilePicture location' })
    .sort(keywords ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const totalDocuments = await Skill.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return res.status(200).json(new ApiResponse(200, { skills, totalPages, currentPage: parseInt(page), totalSkills: totalDocuments }, "Skills fetched successfully"));
});

const getSkillById = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new ApiError(400, "Invalid skill ID format");
  }
  const skill = await Skill.findById(skillId)
    .populate({ path: 'user', select: 'username profilePicture' })
    .populate({ path: 'ratings.user', select: 'username' });
  if (!skill) {
    throw new ApiError(404, 'Skill not found');
  }
  return res.status(200).json(new ApiResponse(200, skill, 'Skill details fetched successfully'));
});

const updateSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const skill = await Skill.findById(skillId);
  if (!skill) throw new ApiError(404, "Skill not found");
  if (skill.user.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to update this skill");
  
  const { title, description, category, level, availability, locationString } = req.body;
  const updatedData = { title, description, category, level, availability, locationString };
  if (title || description) {
    const newText = `${title || skill.title} ${description || skill.description}`;
    updatedData.tags = generateTags(newText);
  }
  if (locationString && locationString.toLowerCase() !== 'remote') {
    try {
      const geoData = await opencage.geocode({ q: locationString, limit: 1, key: process.env.OPENCAGE_API_KEY });
      if (geoData.results.length > 0) {
        const { lng, lat } = geoData.results[0].geometry;
        updatedData.geoCoordinates = { type: 'Point', coordinates: [lng, lat] };
      }
    } catch (error) {
      console.error("Geocoding failed for skill update:", error.message);
    }
  } else {
    updatedData.geoCoordinates = undefined;
  }
  const updatedSkill = await Skill.findByIdAndUpdate(skillId, { $set: updatedData }, { new: true, runValidators: true });
  return res.status(200).json(new ApiResponse(200, updatedSkill, "Skill updated successfully"));
});

const deleteSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const skill = await Skill.findById(skillId);
  if (!skill) throw new ApiError(404, "Skill not found");
  if (skill.user.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to delete this skill");
  await Skill.findByIdAndDelete(skillId);
  return res.status(200).json(new ApiResponse(200, {}, "Skill deleted successfully"));
});

const getNearbySkills = asyncHandler(async (req, res) => {
  const { lat, lon, distance = 50000 } = req.query;
  if (!lat || !lon) throw new ApiError(400, "Latitude and longitude are required");

  const skills = await Skill.find({
    type: 'OFFER',
    geoCoordinates: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
        $maxDistance: parseInt(distance)
      }
    }
  }).populate('user', 'username profilePicture');
    
  return res.status(200).json(new ApiResponse(200, skills, "Nearby skills fetched successfully"));
});

const getMatchingSkills = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const requestSkill = await Skill.findById(skillId);
  if (!requestSkill || requestSkill.type !== 'REQUEST') throw new ApiError(404, "Skill request not found.");

  const potentialMatches = await Skill.find({
    type: 'OFFER',
    user: { $ne: req.user._id },
    $or: [{ category: requestSkill.category }, { tags: { $in: requestSkill.tags } }]
  }).populate('user', 'username profilePicture');
  
  const scoredMatches = potentialMatches.map(match => {
    let score = (match.category === requestSkill.category) ? 10 : 0;
    score += match.tags.filter(tag => requestSkill.tags.includes(tag)).length * 5;
    return { ...match.toObject(), score };
  }).sort((a, b) => b.score - a.score);

  return res.status(200).json(new ApiResponse(200, scoredMatches.slice(0, 5), "Matching skills fetched"));
});

const bookmarkSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const userId = req.user._id;
  const skill = await Skill.findByIdAndUpdate(skillId, { $addToSet: { bookmarkedBy: userId } }, { new: true });
  if (!skill) throw new ApiError(404, "Skill not found");
  return res.status(200).json(new ApiResponse(200, {}, "Skill bookmarked"));
});

const unbookmarkSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const userId = req.user._id;
  const skill = await Skill.findByIdAndUpdate(skillId, { $pull: { bookmarkedBy: userId } }, { new: true });
  if (!skill) throw new ApiError(404, "Skill not found");
  return res.status(200).json(new ApiResponse(200, {}, "Bookmark removed"));
});

const rateSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const { rating } = req.body;
  const userId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Please provide a rating between 1 and 5.");
  }

  let skill = await Skill.findById(skillId);
  if (!skill) throw new ApiError(404, "Skill not found");

  const existingRating = skill.ratings.find(r => r.user.equals(userId));

  if (existingRating) {
    existingRating.rating = rating;
  } else {
    skill.ratings.push({ user: userId, rating });
  }

  await skill.save();
  
  const updatedSkill = await Skill.findById(skillId).populate('ratings.user', 'username');

  return res.status(200).json(new ApiResponse(200, updatedSkill.ratings, "Thank you for your rating!"));
});

export {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  getNearbySkills,
  getMatchingSkills,
  bookmarkSkill,
  unbookmarkSkill,
  rateSkill
};