import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Skill } from '../models/skill.model.js';
import { User } from '../models/user.model.js';
import natural from 'natural';
const { WordTokenizer, TfIdf } = natural;

// --- Helper function to extract keywords using NLP ---
const generateTags = (text) => {
  const tokenizer = new WordTokenizer();
  const tfidf = new TfIdf();
  
  tfidf.addDocument(text.toLowerCase());
  
  // Get the top 5 most significant terms from the text
  const tags = tfidf.listTerms(0)
    .slice(0, 5)
    .map(item => item.term);
    
  return tags;
};

// --- Create a new skill ---
const createSkill = asyncHandler(async (req, res) => {
  const { type, title, description, category, level, availability, location } = req.body;

  if (!type || !title || !description || !category) {
    throw new ApiError(400, 'Type, title, description, and category are required');
  }

  // Auto-generate tags from the title and description
  const tags = generateTags(`${title} ${description}`);

  const skill = await Skill.create({
    user: req.user._id,
    type,
    title,
    description,
    category,
    level,
    availability,
    location,
    tags, // Save the generated tags
  });

  if (!skill) {
    throw new ApiError(500, 'Something went wrong while creating the skill');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, skill, 'Skill posted successfully'));
});

// --- Get all skills with filtering and pagination ---
const getAllSkills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, category, keywords, userId } = req.query;

  const query = {};

  if (type) query.type = type;
  if (category) query.category = category;
  if (keywords) {
    query.$text = { $search: keywords };
  }
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format");
    }
    query.user = userId;
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: keywords ? { score: { $meta: 'textScore' } } : { createdAt: -1 },
    populate: {
      path: 'user',
      select: 'username profilePicture location' // Include location for map view
    }
  };

  const skills = await Skill.find(query)
                            .populate(options.populate)
                            .sort(options.sort)
                            .skip((options.page - 1) * options.limit)
                            .limit(options.limit)
                            .lean();

  const totalDocuments = await Skill.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / options.limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        skills,
        totalPages,
        currentPage: options.page,
        totalSkills: totalDocuments
      },
      "Skills fetched successfully"
    )
  );
});

// --- Get a single skill by its ID ---
const getSkillById = asyncHandler(async (req, res) => {
  const { skillId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(skillId)) {
      throw new ApiError(400, "Invalid skill ID format");
  }

  const skill = await Skill.findById(skillId).populate({
    path: 'user',
    select: 'username profilePicture'
  });

  if (!skill) {
    throw new ApiError(404, 'Skill not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, skill, 'Skill details fetched successfully'));
});

// --- Update a skill ---
const updateSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const { title, description, category, level, availability, location } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new ApiError(400, "Invalid skill ID format");
  }

  const skill = await Skill.findById(skillId);

  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  if (skill.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this skill");
  }

  const updatedData = { title, description, category, level, availability, location };
  
  // Re-generate tags if title or description changes
  if (title || description) {
    const newText = `${title || skill.title} ${description || skill.description}`;
    updatedData.tags = generateTags(newText);
  }

  const updatedSkill = await Skill.findByIdAndUpdate(
    skillId,
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSkill, "Skill updated successfully"));
});

// --- Delete a skill ---
const deleteSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new ApiError(400, "Invalid skill ID format");
  }

  const skill = await Skill.findById(skillId);

  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  if (skill.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this skill");
  }

  await Skill.findByIdAndDelete(skillId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Skill deleted successfully"));
});

// --- Get skills near a location ---
const getNearbySkills = asyncHandler(async (req, res) => {
  const { lat, lon, distance = 50000 } = req.query;

  if (!lat || !lon) {
    throw new ApiError(400, "Latitude and longitude are required");
  }

  const nearbyUsers = await User.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lon), parseFloat(lat)]
        },
        $maxDistance: parseInt(distance)
      }
    }
  }).select('_id');

  const nearbyUserIds = nearbyUsers.map(user => user._id);

  const skills = await Skill.find({ user: { $in: nearbyUserIds }, type: 'OFFER' })
    .populate('user', 'username profilePicture location');
    
  return res.status(200).json(new ApiResponse(200, skills, "Nearby skills fetched successfully"));
});

// --- Get AI-powered skill matches ---
const getMatchingSkills = asyncHandler(async (req, res) => {
  const { skillId } = req.params;

  const requestSkill = await Skill.findById(skillId);
  if (!requestSkill || requestSkill.type !== 'REQUEST') {
    throw new ApiError(404, "Skill request not found.");
  }

  const potentialMatches = await Skill.find({
    type: 'OFFER',
    user: { $ne: req.user._id },
    $or: [
      { category: requestSkill.category },
      { tags: { $in: requestSkill.tags } }
    ]
  }).populate('user', 'username profilePicture');
  
  const scoredMatches = potentialMatches.map(match => {
    let score = 0;
    if (match.category === requestSkill.category) {
      score += 10;
    }
    const commonTags = match.tags.filter(tag => requestSkill.tags.includes(tag));
    score += commonTags.length * 5;
    
    return { ...match.toObject(), score };
  }).sort((a, b) => b.score - a.score);

  return res.status(200).json(new ApiResponse(200, scoredMatches.slice(0, 5), "Matching skills fetched"));
});

export {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  getNearbySkills,
  getMatchingSkills
};