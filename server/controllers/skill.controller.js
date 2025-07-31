import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import { Proposal } from '../models/proposal.model.js';
import natural from 'natural';
import { GoogleGenerativeAI } from '@google/generative-ai';

const { WordTokenizer, TfIdf } = natural;

const categorySubtopics = {
  Tech: ["Learn Python in 1 Hour", "JavaScript Basics", "React Hooks Tutorial", "Node.js for Beginners", "Intro to SQL", "CSS Flexbox Crash Course", "Data Structures Explained", "What is an API?", "Docker Fundamentals", "Git and GitHub Basics", "Intro to Machine Learning", "Cybersecurity Essentials", "Building a REST API", "Vue.js vs React", "TypeScript for Beginners"],
  Art: ["Digital Painting for Beginners", "Character Design Tips", "Perspective Drawing Basics", "Color Theory Explained", "How to Use Procreate", "Watercolor Techniques", "3D Modeling in Blender", "Sketching Fundamentals", "Pixel Art Tutorial", "Understanding Composition", "Creating Digital Illustrations", "Abstract Art Techniques", "Clay Sculpting Basics", "Figure Drawing", "Concept Art for Games"],
  Music: ["Beginner Guitar Chords", "How to Read Sheet Music", "Music Theory 101", "Singing Lessons for Beginners", "Making a Beat in FL Studio", "Piano Basics", "Ukulele First Lesson", "How to Use a DAW", "Songwriting for Beginners", "Drumming Fundamentals", "Music Production Basics", "Mixing and Mastering", "Learn to DJ", "Violin for Beginners", "Bass Guitar Basics"],
  Writing: ["Creative Writing Prompts", "How to Write a Novel", "Screenwriting for Beginners", "Copywriting Tips", "Better Storytelling", "Poetry for Beginners", "Writing a Blog Post", "Editing Your Own Work", "Building Fictional Worlds", "Character Development", "Technical Writing Basics", "Freelance Writing Guide", "How to Overcome Writer's Block", "Journaling for Clarity", "Writing Dialogue"],
  // Add other categories here
};

const createSkill = asyncHandler(async (req, res) => {
  const { type, title, description, category, level, locationString, desiredSkill, costInCredits } = req.body;
  if (!type || !title || !category) {
    throw new ApiError(400, 'Type, title, and category are required');
  }
  const skillData = { 
    user: req.user._id, type, title, description, category, level, 
    locationString, desiredSkill, costInCredits 
  };
  const skill = await Skill.create(skillData);
  return res.status(201).json(new ApiResponse(201, skill, 'Skill posted successfully'));
});

const getAllSkills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 6, category, keywords, userId, location, level } = req.query;
  const query = {};

  if (category) query.category = category;
  if (keywords) {
    query.title = { $regex: new RegExp(keywords, 'i') };
  }
  if (userId) query.user = userId;
  if (level) query.level = level;
  if (location) {
    query.locationString = { $regex: new RegExp(location, 'i') };
  }

  const skills = await Skill.find(query)
    .populate({ path: 'user', select: 'username profilePicture location' })
    .sort({ createdAt: -1 })
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

const getAllSkillsUnpaginated = asyncHandler(async (req, res) => {
  const { category, keywords, location, level } = req.query;
  const query = {};

  if (category) query.category = category;
  if (keywords) query.$text = { $search: keywords };
  if (level) query.level = level;
  if (location) {
    query.locationString = { $regex: new RegExp(location, 'i') };
  }

  const skills = await Skill.find(query)
    .populate({ path: 'user', select: 'username profilePicture' })
    .sort(keywords ? { score: { $meta: 'textScore' } } : { createdAt: -1 });

  const skillsWithAvgRating = skills.map(skill => {
    let averageRating = 0;
    if (skill.ratings && skill.ratings.length > 0) {
      const totalRating = skill.ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = (totalRating / skill.ratings.length).toFixed(1);
    }
    return { ...skill.toObject(), averageRating };
  });
  
  return res.status(200).json(new ApiResponse(200, { skills: skillsWithAvgRating }, "All skills fetched successfully"));
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
    const { title, description, category, level, locationString, desiredSkill, costInCredits } = req.body;
    const updatedData = { title, description, category, level, locationString, desiredSkill, costInCredits };
    const updatedSkill = await Skill.findByIdAndUpdate(skillId, { $set: updatedData }, { new: true, runValidators: true });
    if (!updatedSkill) throw new ApiError(404, "Skill not found");
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
  await Skill.findByIdAndDelete(skillId);
  await Proposal.deleteMany({ $or: [{ requestedSkill: skillId }, { offeredSkill: skillId }] });
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

const getKeywordSuggestions = asyncHandler(async (req, res) => {
    const { search } = req.query;
    if (!search) return res.status(200).json(new ApiResponse(200, [], "No search query provided"));
    const skills = await Skill.aggregate([
        { $match: { title: { $regex: new RegExp(search, 'i') } } },
        { $group: { _id: '$title' } },
        { $limit: 5 },
        { $project: { _id: 0, title: '$_id' } }
    ]);
    return res.status(200).json(new ApiResponse(200, skills, "Keyword suggestions fetched"));
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

const getYoutubeTutorials = asyncHandler(async (req, res) => {
  let { keyword } = req.query;
  if (!keyword) {
    return res.status(200).json(new ApiResponse(200, [], "No keyword provided for Youtube."));
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
  const allTopics = Object.values(categorySubtopics).flat();
  const shuffled = allTopics.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 12);
  return res.status(200).json(new ApiResponse(200, selected, "YouTube placeholders fetched"));
});


const getRecommendedSkills = asyncHandler(async (req, res) => {
  let recommendedSkills = [];
  
  if (req.user) {
    const userBookmarks = await Skill.find({ bookmarkedBy: req.user._id }).select('category tags');

    if (userBookmarks.length > 0) {
      const categories = [...new Set(userBookmarks.map(skill => skill.category))];
      
      recommendedSkills = await Skill.find({
        category: { $in: categories },
        user: { $ne: req.user._id }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username');
    }
  }

  // Fallback: If no recommendations are found (or user is not logged in), get the latest skills
  if (recommendedSkills.length === 0) {
    recommendedSkills = await Skill.find({ user: { $ne: req.user?._id } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username');
  }
  
  return res.status(200).json(new ApiResponse(200, recommendedSkills, "Recommended skills fetched successfully"));
});

const generateSkillDescription = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    throw new ApiError(400, "A title is required to generate a description.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

  const prompt = `Based on the skill title "${title}", generate a friendly and appealing 1-2 sentence description for a skill-swapping website. The user is offering to teach this skill.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const description = response.text();

  return res.status(200).json(new ApiResponse(200, { description }, "Description generated successfully"));
});
export {
  createSkill,
  getAllSkills,
  getAllSkillsUnpaginated,
  getSkillById,
  updateSkill,
  deleteSkill,
  getNearbySkills,
  getLocationSuggestions,
  getKeywordSuggestions,
  getMatchingSkills,
  bookmarkSkill,
  unbookmarkSkill,
  rateSkill,
  getYoutubeTutorials,
  getYoutubePlaceholders,
  getRecommendedSkills,
  generateSkillDescription
};