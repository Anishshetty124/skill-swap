import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import { Proposal } from '../models/proposal.model.js';
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
  const { page = 1, limit = 10, category, keywords, userId, location, level } = req.query;
  const query = {};

  if (category) query.category = category;
  if (keywords) query.$text = { $search: keywords };
  if (userId) query.user = userId;
  if (level) query.level = level;
  if (location) {
    query.locationString = { $regex: new RegExp(location, 'i') };
  }

  const skills = await Skill.find(query)
    .populate({ path: 'user', select: 'username profilePicture location' })
    .sort(keywords ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const skillsWithAvgRating = skills.map(skill => {
    let averageRating = 0;
    if (skill.ratings && skill.ratings.length > 0) {
      const totalRating = skill.ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = (totalRating / skill.ratings.length).toFixed(1);
    }
    return { ...skill.toObject(), averageRating };
  });

  const totalDocuments = await Skill.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return res.status(200).json(new ApiResponse(200, { skills: skillsWithAvgRating, totalPages, currentPage: parseInt(page), totalSkills: totalDocuments }, "Skills fetched successfully"));
});

const getSkillById = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const skill = await Skill.findById(skillId)
    .populate({ path: 'user', select: 'username profilePicture' })
    .populate({ path: 'ratings.user', select: 'username' });
  if (!skill) throw new ApiError(404, 'Skill not found');
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
  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }
  if (skill.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this skill");
  }

  // First, delete the skill itself
  await Skill.findByIdAndDelete(skillId);

  // Then, delete all proposals where this skill was the one being requested
  await Proposal.deleteMany({ requestedSkill: skillId });

  return res.status(200).json(new ApiResponse(200, {}, "Skill and associated proposals deleted successfully"));
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

const getLocationSuggestions = asyncHandler(async (req, res) => {
    const { search } = req.query;
    if (!search) return res.status(200).json(new ApiResponse(200, [], "No search query provided"));
    const locations = await Skill.aggregate([
        { $match: { locationString: { $regex: new RegExp(search, 'i') } } },
        { $group: { _id: '$locationString' } },
        { $limit: 5 },
        { $project: { _id: 0, location: '$_id' } }
    ]);
    return res.status(200).json(new ApiResponse(200, locations, "Suggestions fetched"));
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

const getKeywordSuggestions = asyncHandler(async (req, res) => {
    const { search } = req.query;
    if (!search) {
        return res.status(200).json(new ApiResponse(200, [], "No search query provided"));
    }
    const skills = await Skill.aggregate([
        { $match: { title: { $regex: new RegExp(search, 'i') } } },
        { $group: { _id: '$title' } },
        { $limit: 5 },
        { $project: { _id: 0, title: '$_id' } }
    ]);
    return res.status(200).json(new ApiResponse(200, skills, "Keyword suggestions fetched"));
});

const getYoutubeTutorials = asyncHandler(async (req, res) => {
  let { keyword } = req.query;
  if (!keyword) {
    const defaultTopics = [
      "communication skills", "public speaking", "learn programming for beginners",
      "graphic design basics", "digital marketing", "learn a new language",
      "financial literacy", "creative writing tips", "data science introduction",
      "learn to cook", "fitness for beginners", "project management"
    ];
    keyword = defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
  }
  const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}%20tutorial&type=video&maxResults=6&key=${process.env.YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(youtubeApiUrl);
    const data = await response.json();
    if (data.error) {
      console.error("YouTube API Error:", data.error.message);
      throw new ApiError(500, "Failed to fetch videos from YouTube due to an API error.");
    }
    return res.status(200).json(new ApiResponse(200, data.items || [], "YouTube videos fetched"));
  } catch (error) {
    console.error("Fetch Error:", error);
    throw new ApiError(500, "Failed to fetch videos from YouTube.");
  }
});

const getYoutubePlaceholders = asyncHandler(async (req, res) => {
  const placeholderTopics = [
    "Communication Skills for Beginners", "Public Speaking Tips", "Learn Python in 1 Hour",
    "Graphic Design Basics", "Digital Marketing 101", "Learn a New Language Fast",
    "Financial Literacy Basics", "Creative Writing Prompts", "Introduction to Data Science",
    "How to Cook Pasta", "Fitness for Beginners", "Project Management Fundamentals",
    "Learn to Play Guitar", "Introduction to JavaScript", "Resume Writing Tips"
  ];

  // Shuffle the array and get the first 8 topics
  const shuffled = placeholderTopics.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 8);

  return res.status(200).json(new ApiResponse(200, selected, "YouTube placeholders fetched"));
});

export {
  createSkill, getAllSkills, getSkillById, updateSkill, deleteSkill, getNearbySkills, getLocationSuggestions, getMatchingSkills, bookmarkSkill, unbookmarkSkill, rateSkill, getKeywordSuggestions, getYoutubeTutorials, getYoutubePlaceholders
};