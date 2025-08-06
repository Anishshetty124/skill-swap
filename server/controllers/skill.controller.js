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
};

const generateTags = (text) => {
  if (!text) return [];
  const tokenizer = new WordTokenizer();
  const tfidf = new TfIdf();
  tfidf.addDocument(text.toLowerCase());
  return tfidf.listTerms(0).slice(0, 5).map(item => item.term);
};

const createSkill = asyncHandler(async (req, res) => {
  const { type, title, description, category, level, availability, locationString, desiredSkill, costInCredits, creditsOffered } = req.body;
  
  if (!type || !title || !category) {
    throw new ApiError(400, 'Type, title, and category are required');
  }

  const tags = generateTags(`${title} ${description}`);
  
  const skillData = { 
    user: req.user._id, 
    type, 
    title, 
    description, 
    category, 
    level, 
    availability, 
    tags, 
    locationString, 
    desiredSkill, 
    costInCredits, 
    creditsOffered 
  };

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

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const getAllSkills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 6, category, keywords, userId, location, level } = req.query;
  const query = {};

  if (category) query.category = category;
  if (keywords) {
    const regex = new RegExp(escapeRegex(keywords), 'i'); // Use the escaped regex
    query.title = { $regex: regex };
  }
  if (userId) query.user = userId;
  if (level) query.level = level;
  if (location) {
    query.locationString = { $regex: new RegExp(escapeRegex(location), 'i') };
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
    const { title, description, category, level, availability, locationString, desiredSkill, costInCredits, creditsOffered } = req.body;
    
    const updatedData = { 
      title, 
      description, 
      category, 
      level, 
      availability, 
      locationString, 
      desiredSkill, 
      costInCredits, 
      creditsOffered 
    };
    
    if (title || description) {
        const skill = await Skill.findById(skillId);
        const newText = `${title || skill.title} ${description || skill.description}`;
        updatedData.tags = generateTags(newText);
    }

    const updatedSkill = await Skill.findByIdAndUpdate(skillId, { $set: updatedData }, { new: true, runValidators: true });
    
    if (!updatedSkill) {
      throw new ApiError(404, "Skill not found");
    }

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
  if (!search || search.length < 2) {
    return res.status(200).json(new ApiResponse(200, [], "Query too short"));
  }

  const allTitles = await Skill.distinct('title');

  const suggestions = allTitles.map(title => {
    const similarity = natural.JaroWinklerDistance(search.toLowerCase(), title.toLowerCase());
    return { title, similarity };
  })
  .filter(item => item.similarity > 0.8)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 5);

  return res.status(200).json(new ApiResponse(200, suggestions, "Keyword suggestions fetched"));
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
    let averageRating = 0;
    if (match.ratings && match.ratings.length > 0) {
      const totalRating = match.ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = (totalRating / match.ratings.length).toFixed(1);
    }
    let score = (match.category === requestSkill.category) ? 10 : 0;
    score += match.tags.filter(tag => requestSkill.tags.includes(tag)).length * 5;
    return { ...match.toObject(), score, averageRating }; 
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


const getYoutubePlaceholders = asyncHandler(async (req, res) => {
  const allTopics = Object.values(categorySubtopics).flat();
  const shuffled = allTopics.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 12);
  return res.status(200).json(new ApiResponse(200, selected, "YouTube placeholders fetched"));
});


const getRecommendedSkills = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let recommendedSkills = [];
  
  // Find the user's bookmarked skills
  const userBookmarks = await Skill.find({ bookmarkedBy: userId }).select('category');

  if (userBookmarks.length > 0) {
    const categories = [...new Set(userBookmarks.map(skill => skill.category))];
    
    // Find other skills in the same categories, excluding the user's own
    recommendedSkills = await Skill.find({
      category: { $in: categories },
      user: { $ne: userId } // Exclude the user's own skills
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'username');
  }

  // Fallback: If no recommendations are found, get the latest skills from other users
  if (recommendedSkills.length === 0) {
    recommendedSkills = await Skill.find({ user: { $ne: userId } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username');
  }
  
   const skillsWithAvgRating = recommendedSkills.map(skill => {
    let averageRating = 0;
    if (skill.ratings && skill.ratings.length > 0) {
      const totalRating = skill.ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = (totalRating / skill.ratings.length).toFixed(1);
    }
    return { ...skill.toObject(), averageRating };
  });

  return res.status(200).json(new ApiResponse(200, skillsWithAvgRating, "Recommended skills fetched successfully"));
});

const generateAiContent = asyncHandler(async (req, res) => {
  const { context, title, type, query, history } = req.body;

  if (!context) {
    throw new ApiError(400, "A context is required.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  let model;
  let prompt;
  let chatHistory = history || [];

  switch (context) {
    case 'generate-description':
      if (!title || !type) throw new ApiError(400, "Title and type are required for description generation.");
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
      prompt = type === 'OFFER'
      ? `Based on the skill title "${title}", generate a friendly and appealing 1-2 sentence description for a skill-swapping website. The user is offering to teach this skill.`
      : `for learning skill-"${title}", generate a friendly and appealing 1-2 sentence description for a skill-swapping website.where the user is requesting to learn this skill.`;
      break;
    
    case 'ask-ai':
      if (!query) throw new ApiError(400, "A query is required for the AI chat.");
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        // --- NEW, IMPROVED SYSTEM PROMPT ---
        systemInstruction: `
          You are "SkillBot", a friendly and encouraging AI assistant for a skill-swapping website.
          Your primary purpose is to answer questions about learnable skills.
          - **Formatting is crucial.** Always use Markdown for your responses. Use bullet points for lists, bold text for emphasis,give space between points subcontents and properly formatted code blocks for any code examples.
          - Maintain the context of the conversation. If the user asks a follow-up question, understand it relates to the previous topic.
          - If the user asks a question that is clearly NOT about a learnable skill (e.g., politics, celebrities), you MUST politely decline with this exact phrase: "I can only answer questions about skills. Please try another topic!"
        `,
      });
      prompt = query;
      break;

    default:
      throw new ApiError(400, "Invalid AI context provided.");
  }

  try {
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    return res.status(200).json(new ApiResponse(200, { response: text }, "AI response generated successfully"));
  } catch (error) {
    console.error("Google AI Error:", error);
    throw new ApiError(500, "The AI service is currently unavailable.");
  }
});

const getYoutubeTutorials = asyncHandler(async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(200).json(new ApiResponse(200, [], "No keyword provided."));
  }

  // --- AI Safety Check ---
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    const safetyPrompt = `
    Is the following search query about a legitimate, safe-for-work, non-abusive, non-badword, learnable skill?
    Query: "${keyword}"
    Respond with only "YES" or "NO".
  `;
    
    const safetyResult = await model.generateContent(safetyPrompt);
    const safetyResponse = await safetyResult.response;
    const decision = safetyResponse.text().trim().toUpperCase();

    if (decision !== 'YES') {
      // If the AI says "NO", block the search.
      return res.status(200).json(new ApiResponse(200, [], "Query blocked by safety filter."));
    }
  } catch (error) {
    console.error("AI Safety Check Failed (will proceed without it):", error);
  }
  
  const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}%20tutorial&type=video&maxResults=6&key=${process.env.YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(youtubeApiUrl);
    const data = await response.json();
    if (data.error) {
      console.error("YouTube API Error:", data.error.message);
      throw new ApiError(500, "Failed to fetch videos from YouTube.");
    }
    return res.status(200).json(new ApiResponse(200, data.items || [], "YouTube videos fetched"));
  } catch (error) {
    console.error("Fetch Error:", error);
    throw new ApiError(500, "Failed to fetch videos from YouTube.");
  }
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
  generateAiContent
};