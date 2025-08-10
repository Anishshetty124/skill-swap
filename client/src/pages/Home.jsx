import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import SkillCardSkeleton from '../components/skills/SkillCardSkeleton';
import { debounce } from 'lodash';
import { MagnifyingGlassIcon as SearchIcon, UserGroupIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import RecommendedSkills from '../components/home/RecommendedSkills';
import LeaderboardPreview from '../components/home/LeaderboardPreview';

const Home = () => {
  const [skills, setSkills] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ keywords: '', category: '', level: '' });
  const [locationQuery, setLocationQuery] = useState('');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [currentSearch, setCurrentSearch] = useState('');
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubePlaceholders, setYoutubePlaceholders] = useState([]);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [searchedKeyword, setSearchedKeyword] = useState('');
  

  const SKILLS_LIMIT = 6;

  const buildQueryString = (pageNum = 1, currentFilters = filters, currentLocQuery = locationQuery) => {
    const params = new URLSearchParams({ page: pageNum, limit: SKILLS_LIMIT });
    if (currentFilters.keywords) params.append('keywords', currentFilters.keywords);
    if (currentFilters.category) params.append('category', currentFilters.category);
    if (currentFilters.level) params.append('level', currentFilters.level);
    if (currentLocQuery) params.append('location', currentLocQuery);
    return params.toString();
  };

  const fetchSkills = async (pageNum = 1, isNewSearch = false, currentFilters = filters, currentLocQuery = locationQuery) => {
    try {
      setLoading(true);
      setError('');
      const queryString = buildQueryString(pageNum, currentFilters, currentLocQuery);
      const response = await apiClient.get(`/skills?${queryString}`);
      const newSkills = response.data.data.skills || [];
      if (isNewSearch) {
        setSkills(newSkills);
      } else {
        setSkills(prevSkills => [...prevSkills, ...newSkills]);
      }
      setHasMore(newSkills.length === SKILLS_LIMIT);
    } catch (err) {
      setError('Failed to load skills.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchYoutubeVideos = async (keyword) => {
    if (!keyword) return;
    setYoutubeLoading(true);
    setYoutubePlaceholders([]);
    try {
      const response = await apiClient.get(`/skills/youtube-tutorials?keyword=${encodeURIComponent(keyword)}`);
      setYoutubeVideos(response.data.data);
    } catch (err) {
      console.error("Failed to fetch YouTube videos", err);
    } finally {
      setYoutubeLoading(false);
    }
  };
  
  const fetchYoutubePlaceholders = async () => {
    try {
        const response = await apiClient.get('/skills/youtube-placeholders');
        setYoutubePlaceholders(response.data.data);
    } catch (error) {
        console.error("Failed to fetch YouTube placeholders", error);
    }
  }

  useEffect(() => {
    fetchSkills(1, true);
    fetchYoutubePlaceholders();
  }, []);

   const handleMainSearch = (e, currentFilters = filters, currentLocQuery = locationQuery) => {
    if (e) e.preventDefault();
    let searchTerms = [];
    if (currentFilters.keywords) searchTerms.push(currentFilters.keywords);
    if (currentFilters.category) searchTerms.push(currentFilters.category);
    if (currentFilters.level) searchTerms.push(currentFilters.level);
    if (currentLocQuery) searchTerms.push(currentLocQuery);
    const searchTermDisplay = searchTerms.join(', ');
    
    setCurrentSearch(searchTermDisplay); 
    
    setPage(1);
    setHasMore(true);
    setSkills([]);
    fetchSkills(1, true, currentFilters, currentLocQuery);
    
    setSearchedKeyword(currentFilters.keywords);
    fetchYoutubeContent(currentFilters.keywords);
    
    setKeywordSuggestions([]);
    setLocationSuggestions([]);
  };

  const handleCitySearch = (e, currentFilters = filters, currentLocQuery = locationQuery) => {
    if (e) e.preventDefault();
    let searchTerms = [];
    if (currentFilters.keywords) searchTerms.push(currentFilters.keywords);
    if (currentFilters.category) searchTerms.push(currentFilters.category);
    if (currentFilters.level) searchTerms.push(currentFilters.level);
    if (currentLocQuery) searchTerms.push(currentLocQuery);
    const searchTermDisplay = searchTerms.join(', ');
    
    setCurrentSearch(searchTermDisplay); 
    
    setPage(1);
    setHasMore(true);
    setSkills([]);
    fetchSkills(1, true, currentFilters, currentLocQuery);
    
    setLocationSuggestions([]);
  };

  const loadMoreSkills = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSkills(nextPage, false);
  };

  const clearMainFilters = () => {
    setFilters({ keywords: '', category: '', level: '' });
    setSearchedKeyword('');
    handleMainSearch(null, { keywords: '', category: '', level: '' }, locationQuery);
  };

   const clearCityFilter = () => {
    setLocationQuery('');
    setShowCitySearch(false); 
    handleCitySearch(null, filters, '');
  };

  const fetchKeywordSuggestions = async (query) => {
    if (query.length > 1) {
      const response = await apiClient.get(`/skills/keyword-suggestions?search=${query}`);
      setKeywordSuggestions(response.data.data);
    } else {
      setKeywordSuggestions([]);
    }
  };

  const fetchLocationSuggestions = async (query) => {
    if (query.length > 1) {
      const response = await apiClient.get(`/skills/locations?search=${query}`);
      setLocationSuggestions(response.data.data);
    } else {
      setLocationSuggestions([]);
    }
  };

  const debouncedKeywordFetch = useCallback(debounce(fetchKeywordSuggestions, 300), []);
  const debouncedLocationFetch = useCallback(debounce(fetchLocationSuggestions, 300), []);

  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, keywords: value }));
    debouncedKeywordFetch(value);
  };

   const fetchYoutubeContent = async (keyword = '') => {
    setYoutubeLoading(true);
    try {
      const isAuthenticated = false; 
      if (keyword) {
        const response = await apiClient.get(`/skills/youtube-tutorials?keyword=${encodeURIComponent(keyword)}`);
        console.log("📺 YouTube API response:", response.data); 
        setYoutubeVideos(response.data.data);
        setYoutubePlaceholders([]);
      } else {
        const endpoint = isAuthenticated ? '/skills/personalized-youtube-placeholders' : '/skills/youtube-placeholders';
        const response = await apiClient.get(endpoint);
        setYoutubePlaceholders(response.data.data);
        setYoutubeVideos([]);
      }
    } catch (err) {
      console.error("Failed to fetch YouTube content", err);
    } finally {
      setYoutubeLoading(false);
    }
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);
    debouncedLocationFetch(value);
  };

const handleShowLess = () => {
    setPage(1);
    setHasMore(true);
    fetchSkills(1, true, filters, locationQuery);
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
      searchResults.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const skillCategories = ['Tech', 'Art', 'Music', 'Writing', 'Marketing', 'Language', 'Fitness', 'Cooking', 'Crafts','others'];
  const isAnyFilterActive = filters.keywords || filters.category || filters.level || locationQuery;
  const displayedSkills = showAllSkills ? skills : skills.slice(0, 6);
  const isMainFilterActive = filters.keywords || filters.category || filters.level;

  return (
    <div>
     <div className="w-full bg-gradient-to-r dark:from-blue-600 dark:to-cyan-500 from-blue-300 to-cyan-200 text-blue-900 dark:text-white text-center rounded-lg py-20 transition-all duration-300">
  <div className="container mx-auto px-4">
    <h1 className="text-5xl font-extrabold mb-4">Share What You Know, Learn What You Crave.</h1>
    <p className="text-xl opacity-90 mb-8">Join a vibrant community where your skills become currency, your passion fuels progress,<br/> and every connection is a chance to grow , teach , and thrive together.</p>
    <div className="mt-6">
      <Link
        to="/skills/new"
        className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold shadow-xl rounded-full hover:scale-105 transition-transform duration-300"
      >
        🚀 Post Your Skill Now
      </Link>
    </div>
  </div>
</div>



      <form onSubmit={handleMainSearch} className="mb-8 p-4 mt-2  bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-5 gap-4 items-end transition-colors duration-300">
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-medium mb-1">Search by Keyword</label>
          <input type="text" name="keywords" value={filters.keywords} onChange={handleKeywordChange} placeholder="e.g., Python, Guitar" className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md" autoComplete="off" />
          {keywordSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-slate-100 dark:bg-gray-600 border rounded-md mt-1 shadow-lg">
              {keywordSuggestions.map((s, index) => (
                <li key={index} className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600" onClick={() => { setFilters(prev => ({...prev, keywords: s.title})); setKeywordSuggestions([]); }}>
                  {s.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select name="category" value={filters.category} onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md">
            <option value="">All</option>
            {skillCategories.map(cat => <option key={cat} value={cat} className="bg-white dark:bg-slate-700">{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skill Level</label>
          <select name="level" value={filters.level} onChange={(e) => setFilters(prev => ({...prev, level: e.target.value}))} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md">
            <option value="">All</option>
            <option className="bg-white dark:bg-slate-700">Beginner</option>
            <option className="bg-white dark:bg-slate-700">Intermediate</option>
            <option className="bg-white dark:bg-slate-700">Expert</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
    <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Filter</button>
    {isMainFilterActive && (
      <button 
        type="button" 
        onClick={clearMainFilters} 
        className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
      >
        Clear
      </button>
    )}
</div>
      </form>
      
      <div className="mb-8 px-4 py-6 w-full md:w-[80%] mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg transition-colors duration-300">
  {!showCitySearch ? (
    <div className="flex flex-col md:flex-row md:items-center md:justify-evenly gap-4 text-center md:text-left">
      <h2 className="text-xl font-bold">
        Looking to discover skills or talents in a specific city or location?
      </h2>
      <button
        onClick={() => setShowCitySearch(true)}
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
      >
        Search by City
      </button>
    </div>
  ) : (
    <form onSubmit={handleCitySearch} className="relative">
      <label className="block text-sm font-medium mb-1">Search by City Name</label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">        
        <input
          type="text"
          value={locationQuery}
          onChange={handleLocationInputChange}
          placeholder="Enter a city or place..."
          className="flex-grow px-4 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
        >
          Search
        </button>
        {locationQuery && (
          <button
            type="button"
            onClick={clearCityFilter}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
          >
            Clear
          </button>
        )}
      </div>
      {locationSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border rounded-md mt-1 shadow-lg">
          {locationSuggestions.map((s, index) => (
            <li
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600"
              onClick={() => {
                setLocationQuery(s.location);
                setLocationSuggestions([]);
              }}
            >
              {s.location}
            </li>
          ))}
        </ul>
      )}
    </form>
  )}
</div>


      
      {currentSearch && !loading && ( <h2 className="text-2xl font-bold mb-4">Showing results for: <span className="text-blue-600">{currentSearch}</span></h2> )}
      
      
      {loading && skills.length === 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, index) => <SkillCardSkeleton key={index} />)}
  </div>
) : error ? (
  <p className="text-center p-10 text-white-500">{error}</p>
) : skills.length > 0 ? (
  <>
    <div id="search-results" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill) => <SkillCard key={skill._id} skill={skill} />)}
    </div>
    
    {/* Button Logic */}
    <div className="text-center mt-8">
      {hasMore ? (
        <button 
          onClick={loadMoreSkills} 
          disabled={loading} 
          className="px-6 py-2 bg-white dark:bg-slate-700 font-semibold rounded-md disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More Skills'}
        </button>
      ) : (
        skills.length > 6 &&
        <button 
          onClick={handleShowLess} 
          className="px-6 py-2 bg-white dark:bg-slate-700 font-semibold rounded-md"
        >
          Show Less
        </button>
      )}
    </div>
  </>
) : (
  <p className="text-center p-10 text-slate-500">{currentSearch ? "No skills found." : "No skills posted yet."}</p>
)}

    
      <div className="mt-16 text-center">
        {(searchedKeyword || (!searchedKeyword && youtubeVideos.length === 0 && youtubePlaceholders.length > 0)) && (
  <h2 className="text-3xl font-bold mb-8">
    {searchedKeyword
      ? `Tutorials for "${searchedKeyword}"`
      : "Explore Skills with YouTube"}
  </h2>
)}

        
        {youtubeLoading ? (
            <p>Loading tutorials...</p>
        ) : youtubeVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* This part maps and displays the video cards */}
              {youtubeVideos.map(video => (
                <a key={video.id.videoId || video.id} href={`https://www.youtube.com/watch?v=${video.id.videoId || video.id}`} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden group">
                  <img src={video.snippet.thumbnails.high.url} alt={video.snippet.title} className="w-full h-48 object-cover"/>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-accent-500">{video.snippet.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{video.snippet.channelTitle}</p>
                  </div>
                </a>
              ))}
            </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {searchedKeyword ? (
              <p className="text-slate-500 italic">No tutorials found for this topic. It may be an invalid or inappropriate search.</p>
            ) : (
              youtubePlaceholders.map((topic, index) => (
                <a key={index} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-sm font-semibold rounded-full hover:bg-slate-300 dark:hover:bg-slate-600">
                  {topic}
                </a>
              ))
            )}
          </div>
        )}
      </div>
       <RecommendedSkills />

       <div className="mt-16 text-center bg-slate-100 dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Join the Community</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            See who's leading the community in skills and credits, and start your own journey to the top!
          </p>
          <Link 
            to="/leaderboard" 
            className="inline-block px-8 py-3 bg-accent-600 text-white font-bold rounded-full shadow-lg hover:bg-accent-700 transition-colors"
          >
            View the Leaderboard
          </Link>
        </div>
         
         <div
  className="
    mt-16 text-center p-8 rounded-2xl shadow-lg max-w-xl mx-auto
    bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200
    dark:from-yellow-900 dark:via-yellow-800 dark:to-yellow-900
    ring-2 ring-yellow-300/50 dark:ring-yellow-600/70
  "
>
  <h2 className="text-3xl font-extrabold mb-4 text-yellow-800 dark:text-yellow-300 drop-shadow-sm">
    Feeling Lucky?
  </h2>
  <p className="text-yellow-700 dark:text-yellow-200 mb-6 max-w-xl mx-auto leading-relaxed text-lg">
    Try your luck with our{" "}
    <span className="font-semibold underline decoration-yellow-500 dark:decoration-yellow-400">
      Daily Lucky Roll
    </span>{" "}
    and win free Swap Credits to help you on your learning journey!
  </p>
  <Link
    to="/lucky-roll"
    className="
      inline-block px-10 py-3
      bg-yellow-400 hover:bg-yellow-500
      text-yellow-900 font-semibold rounded-full shadow-md
      transition-colors tracking-wide
      ring-1 ring-yellow-500/70 hover:ring-yellow-600
      dark:bg-yellow-600 dark:text-yellow-100 dark:hover:bg-yellow-700
    "
  >
    Try the Lucky Roll
  </Link>
</div>

      
      <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-8">How SkillSwap Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
                      <SearchIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">1. Find a Skill</h3>
                  <p className="text-slate-600 dark:text-slate-400">Browse or search for a skill you want to learn from our talented community.</p>
              </div>
              <div className="flex flex-col items-center">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
                      <ArrowsRightLeftIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">2. Propose a Swap</h3>
                  <p className="text-slate-600 dark:text-slate-400">Use your Swap Credits to propose an exchange. You earn credits by offering your own skills.</p>
              </div>
              <div className="flex flex-col items-center">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
                      <UserGroupIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">3. Connect & Learn</h3>
                  <p className="text-slate-600 dark:text-slate-400">Once your proposal is accepted, connect with the user to learn your new skill!</p>
              </div>
          </div>
      </div>
    </div>
  );
};
export default Home;
