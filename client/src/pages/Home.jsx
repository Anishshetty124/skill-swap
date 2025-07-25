import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import SkillCardSkeleton from '../components/skills/SkillCardSkeleton';
import { debounce } from 'lodash';

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
  const [youtubeLoading, setYoutubeLoading] = useState(true);

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
  
  const fetchYoutubeVideos = async (keyword = '') => {
    setYoutubeLoading(true);
    try {
      const response = await apiClient.get(`/skills/youtube-tutorials?keyword=${encodeURIComponent(keyword)}`);
      setYoutubeVideos(response.data.data);
    } catch (err) {
      console.error("Failed to fetch YouTube videos", err);
    } finally {
      setYoutubeLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills(1, true);
    fetchYoutubeVideos();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    let searchTerms = [];
    if (filters.keywords) searchTerms.push(filters.keywords);
    if (filters.category) searchTerms.push(filters.category);
    if (filters.level) searchTerms.push(filters.level);
    if (locationQuery) searchTerms.push(locationQuery);
    const searchTermDisplay = searchTerms.join(', ');
    setCurrentSearch(searchTermDisplay || 'all skills');
    
    setPage(1);
    setHasMore(true);
    setSkills([]);
    fetchSkills(1, true);
    fetchYoutubeVideos(filters.keywords);
    
    setKeywordSuggestions([]);
    setLocationSuggestions([]);
  };

  const loadMoreSkills = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSkills(nextPage, false);
  };

  const clearSearch = () => {
    const emptyFilters = { keywords: '', category: '', level: '' };
    const emptyLocation = '';
    setFilters(emptyFilters);
    setLocationQuery(emptyLocation);
    setCurrentSearch('');
    setShowCitySearch(false);
    setPage(1);
    setHasMore(true);
    setSkills([]);
    fetchSkills(1, true, emptyFilters, emptyLocation); // Re-fetch with empty filters
    fetchYoutubeVideos();
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

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);
    debouncedLocationFetch(value);
  };

  const skillCategories = ['Tech', 'Art', 'Music', 'Writing', 'Marketing', 'Language', 'Fitness', 'Cooking', 'Crafts'];
  const isAnyFilterActive = filters.keywords || filters.category || filters.level || locationQuery;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">Discover & Exchange Skills</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">The premier platform for bartering your talents.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-5 gap-4 items-end transition-colors duration-300">
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-medium mb-1">Search by Keyword</label>
          <input type="text" name="keywords" value={filters.keywords} onChange={handleKeywordChange} placeholder="e.g., Python, Guitar" className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md" autoComplete="off" />
          {keywordSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border rounded-md mt-1 shadow-lg">
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
            {isAnyFilterActive && (
              <button type="button" onClick={clearSearch} className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600">Clear</button>
            )}
        </div>
      </form>
      
      <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg transition-colors duration-300">
        {!showCitySearch ? (
            <div className="text-center md:text-left">
                <h2 className="text-xl font-bold mb-2">Looking for skills in a specific area?</h2>
                <button onClick={() => setShowCitySearch(true)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Search by City</button>
            </div>
        ) : (
          <form onSubmit={handleSearch} className="relative">
            <label className="block text-sm font-medium mb-1">Search by City Name</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={locationQuery} onChange={handleLocationInputChange} placeholder="Enter a city or place..." className="flex-grow px-4 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md" autoComplete="off"/>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Search</button>
              {locationQuery && (
                <button type="button" onClick={clearSearch} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600">Clear</button>
              )}
            </div>
            {locationSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border rounded-md mt-1 shadow-lg">
                    {locationSuggestions.map((s, index) => (
                        <li key={index} className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600"
                            onClick={() => { setLocationQuery(s.location); setLocationSuggestions([]); }}>
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
        <p className="text-center p-10 text-red-500">{error}</p>
      ) : skills.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => <SkillCard key={skill._id} skill={skill} />)}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button onClick={loadMoreSkills} disabled={loading} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md disabled:opacity-50">
                {loading ? 'Loading...' : 'Load More Skills'}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center p-10 text-slate-500">No skills found matching your criteria.</p>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          {filters.keywords ? `Tutorials for "${filters.keywords}"` : "Explore Skills with YouTube"}
        </h2>
        {youtubeLoading ? (
          <p>Loading tutorials...</p>
        ) : youtubeVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {youtubeVideos.map(video => (
              <a key={video.id.videoId || video.id} href={`https://www.youtube.com/watch?v=${video.id.videoId || video.id}`} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden group">
                <img src={video.snippet.thumbnails.high.url} alt={video.snippet.title} className="w-full h-48 object-cover"/>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-500">{video.snippet.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{video.snippet.channelTitle}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500">No tutorials found.</p>
        )}
      </div>
    </div>
  );
};

export default Home;