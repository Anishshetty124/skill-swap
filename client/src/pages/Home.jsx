import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import MapComponent from '../components/map/MapComponent';
import { debounce } from 'lodash';

const Home = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('card');
  
  const [filters, setFilters] = useState({
    keywords: '',
    category: '',
    level: ''
  });
  
  const [locationQuery, setLocationQuery] = useState('');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [currentSearch, setCurrentSearch] = useState('');
  const [showCitySearch, setShowCitySearch] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.keywords) params.append('keywords', filters.keywords);
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    if (locationQuery) params.append('location', locationQuery);
    return params.toString();
  };
  
  const fetchSkills = async (queryString = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/skills?${queryString}`);
      const data = response.data.data;
      setSkills(data.skills || []);
    } catch (err) {
      setError('Failed to load skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let searchTerms = [];
    if (filters.keywords) searchTerms.push(filters.keywords);
    if (filters.category) searchTerms.push(filters.category);
    if (filters.level) searchTerms.push(filters.level);
    if (locationQuery) searchTerms.push(locationQuery);
    
    const searchTermDisplay = searchTerms.join(', ');
    setCurrentSearch(searchTermDisplay || 'all skills');
    
    fetchSkills(buildQueryString());
    setKeywordSuggestions([]);
    setLocationSuggestions([]);
  };
  
  const clearSearch = () => {
    setFilters({ keywords: '', category: '', level: '' });
    setLocationQuery('');
    setCurrentSearch('');
    setShowCitySearch(false);
    fetchSkills();
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

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Discover Skills</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setView('card')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'card' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Card</button>
            <button onClick={() => setView('map')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'map' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Map</button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-medium mb-1">Search by Keyword</label>
          <input type="text" name="keywords" value={filters.keywords} onChange={handleKeywordChange} placeholder="e.g., Python, Guitar" className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md" autoComplete="off" />
          {keywordSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg">
              {keywordSuggestions.map((s, index) => (
                <li key={index} className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => { setFilters(prev => ({...prev, keywords: s.title})); setKeywordSuggestions([]); }}>
                  {s.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select name="category" value={filters.category} onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md">
            <option value="">All</option>
            {skillCategories.map(cat => <option key={cat} value={cat} className="bg-white dark:bg-gray-700">{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skill Level</label>
          <select name="level" value={filters.level} onChange={(e) => setFilters(prev => ({...prev, level: e.target.value}))} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md">
            <option value="">All</option>
            <option className="bg-white dark:bg-gray-700">Beginner</option>
            <option className="bg-white dark:bg-gray-700">Intermediate</option>
            <option className="bg-white dark:bg-gray-700">Expert</option>
          </select>
        </div>
        <div className="md:col-span-4 flex justify-end gap-2">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Search</button>
            <button type="button" onClick={clearSearch} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600">Clear</button>
        </div>
      </form>
      
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {!showCitySearch ? (
            <>
                <h2 className="text-xl font-bold mb-2">Looking for skills in a specific area?</h2>
                <button onClick={() => setShowCitySearch(true)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Search by City</button>
            </>
        ) : (
          <form onSubmit={handleSearch} className="relative">
            <label className="block text-sm font-medium mb-1">Search by City Name</label>
            <div className="flex gap-2">
              <input type="text" value={locationQuery} onChange={handleLocationInputChange} placeholder="Enter a city or place..." className="flex-grow px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md" autoComplete="off"/>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Search City</button>
            </div>
            {locationSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg">
                    {locationSuggestions.map((s, index) => (
                        <li key={index} className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={() => {
                                setLocationQuery(s.location);
                                setLocationSuggestions([]);
                            }}>
                            {s.location}
                        </li>
                    ))}
                </ul>
            )}
          </form>
        )}
      </div>
      
      {currentSearch && !loading && ( <h2 className="text-2xl font-bold mb-4">Showing results for: <span className="text-indigo-600">{currentSearch}</span></h2> )}
      
      {loading && <p className="text-center p-10">Searching for skills...</p>}
      {error && !loading && <p className="text-center p-10 text-red-500">{error}</p>}

      {!loading && !error && (
        view === 'card' ? (
          skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => <SkillCard key={skill._id} skill={skill} />)}
            </div>
          ) : (
             <p className="text-center p-10 text-gray-500">No skills found matching your criteria.</p>
          )
        ) : (
          <MapComponent skills={skills} />
        )
      )}
    </div>
  );
};

export default Home;