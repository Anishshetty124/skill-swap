import React, { useState, useEffect, useCallback, useMemo, Suspense ,useRef} from 'react';
import apiClient from '../api/axios';
import { debounce } from 'lodash';
import { MagnifyingGlassIcon as SearchIcon, UserGroupIcon, ArrowsRightLeftIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import RecommendedSkills from '../components/home/RecommendedSkills';
import LeaderboardPreview from '../components/home/LeaderboardPreview';
import { ArrowDownCircleIcon, Gift } from 'lucide-react';
import LazyLoad from '../components/common/LazyLoad';

const UserSearch = React.lazy(() => import('../components/home/UserSearch'));
const SkillCard = React.lazy(() => import('../components/skills/SkillCard'));
const SkillCardSkeleton = React.lazy(() => import('../components/skills/SkillCardSkeleton'));
const SKILLS_LIMIT = 6;

const Home = () => {
  const [skills, setSkills] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt'); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ keywords: '', category: '', level: '' });
  const [locationQuery, setLocationQuery] = useState('');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [currentSearch, setCurrentSearch] = useState('');
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubePlaceholders, setYoutubePlaceholders] = useState([]);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const userSearchRef = useRef(null);
  const skillCategories = useMemo(() => [
    'Tech', 'Art', 'Music', 'Writing', 'Marketing', 'Language', 'Fitness', 'Cooking', 'Crafts', 'others'
  ], []);

  
  const buildQueryString = (pageNum = 1, currentFilters = filters, currentLocQuery = locationQuery) => {
    const params = new URLSearchParams({ page: pageNum, limit: SKILLS_LIMIT });
    if (currentFilters.keywords) params.append('keywords', currentFilters.keywords);
    if (currentFilters.category) params.append('category', currentFilters.category);
    if (currentFilters.level) params.append('level', currentFilters.level);
    if (currentLocQuery) params.append('location', currentLocQuery);
    return params.toString();
  };


  const fetchSkills = async (pageNum = 1, isNewSearch = false, currentFilters = filters, currentLocQuery = locationQuery) => {
    setLoading(true);
    setError('');
    try {
      const queryString = buildQueryString(pageNum, currentFilters, currentLocQuery);
      const response = await apiClient.get(`/skills?${queryString}`);
      const newSkills = response.data.data.skills || [];
      setSkills(isNewSearch ? newSkills : prev => [...prev, ...newSkills]);
      setHasMore(newSkills.length === SKILLS_LIMIT);
    } catch {
      setError('Failed to load skills.');
    } finally {
      setLoading(false);
    }
  };


  const fetchYoutubePlaceholders = async () => {
    try {
      const response = await apiClient.get('/skills/youtube-placeholders');
      setYoutubePlaceholders(response.data.data);
    } catch {
      
    }
  };

  const debouncedYoutubeFetch = useCallback(
    debounce(async (keyword) => {
      if (!keyword) return setYoutubeVideos([]);
      setYoutubeLoading(true);
      try {
        const response = await apiClient.get(`/skills/youtube-tutorials?keyword=${encodeURIComponent(keyword)}`);
        setYoutubeVideos(response.data.data);
      } catch {
        setYoutubeVideos([]);
      } finally {
        setYoutubeLoading(false);
      }
    }, 400),
    []
  );

  useEffect(() => {
  fetchSkills(1, true); 

  fetchYoutubePlaceholders();

  return () => {
    debouncedKeywordFetch.cancel();
    debouncedYoutubeFetch.cancel();
  };
}, []);

const fetchKeywordSuggestions = async (query) => {
    if (query.length > 1) {
      try {
        const response = await apiClient.get(`/skills/keyword-suggestions?search=${query}`);
        const suggestions = response.data.data || [];

        const uniqueSuggestions = [
          ...new Map(suggestions.map((item) => [item.title, item])).values(),
        ];

        setKeywordSuggestions(uniqueSuggestions);
      } catch (error) {
        console.error("Failed to fetch keyword suggestions:", error);
        setKeywordSuggestions([]);
      }
    } else {
      setKeywordSuggestions([]);
    }
  };


  const debouncedKeywordFetch = useCallback(debounce(fetchKeywordSuggestions, 300), []);

  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, keywords: value }));
    debouncedKeywordFetch(value);
  };

const handleMainSearch = (e, customFilters = undefined, currentLocQuery = locationQuery) => {
  if (e) e.preventDefault();

  const activeFilters = customFilters !== undefined ? customFilters : filters;

  setShowScrollButton(true);
  setError('');
  setSkills([]); 

  const searchTerms = [
    activeFilters.keywords,
    activeFilters.category,
    activeFilters.level,
    currentLocQuery
  ].filter(Boolean);

  setCurrentSearch(searchTerms.join(', '));
  
  setPage(1);
  setHasMore(true);
  fetchSkills(1, true, activeFilters, currentLocQuery);
  
  setKeywordSuggestions([]);

  setSearchedKeyword(activeFilters.keywords);
  debouncedYoutubeFetch(activeFilters.keywords);
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
    setYoutubeVideos([]);
    setShowScrollButton(false);
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


  
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setUserResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setIsSkillSearchActive(true);
    fetchSkills(1, true, filters);
    setShowScrollButton(true);
  };

  const handleClearSkillSearch = () => {
    const clearedFilters = { keyword: '', category: '', type: '' };
    setFilters(clearedFilters);
    setPage(1);
    setIsSkillSearchActive(false);
    fetchSkills(1, true, clearedFilters);
    setShowScrollButton(false);
  };
  

  const scrollToResults = () => {
    const resultsSection = document.getElementById('search-results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    setShowScrollButton(false); 
  };

  const isAnyFilterActive = filters.keywords || filters.category || filters.level || locationQuery;
  const displayedSkills = showAllSkills ? skills : skills.slice(0, 6);
  const isMainFilterActive = currentSearch !== '';
  const sortedSkills = useMemo(() => {
    const skillsToSort = [...skills];
    
    if (sortBy === 'averageRating') {
      skillsToSort.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      skillsToSort.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return skillsToSort;
  }, [skills, sortBy]); 
  return (
    <div>
      <div className="w-full bg-gradient-to-r dark:from-blue-600 dark:to-cyan-500 from-blue-300 to-cyan-200 text-blue-900 dark:text-white text-center rounded-lg py-20 transition-all duration-300">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-extrabold mb-4">
            Share What You Know, Learn What You Crave.
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Join a vibrant community where your skills become currency, your
            passion fuels progress,
            <br /> and every connection is a chance to grow , teach , and thrive
            together.
          </p>
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

      <form
        onSubmit={handleMainSearch}
        className="mb-8 p-4 mt-2  bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-5 gap-4 items-end transition-colors duration-300"
      >
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-medium mb-1">
            Search by Keyword
          </label>
          <input
            type="text"
            name="keywords"
            value={filters.keywords}
            onChange={handleKeywordChange}
            placeholder="e.g., Python, Guitar"
            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
            autoComplete="off"
          />
          {keywordSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-slate-100 dark:bg-gray-600 border rounded-md mt-1 shadow-lg">
              {keywordSuggestions.map((s, index) => (
                <li
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, keywords: s.title }));
                    setKeywordSuggestions([]);
                  }}
                >
                  {s.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
          >
            <option value="">All</option>
            {skillCategories.map((cat) => (
              <option
                key={cat}
                value={cat}
                className="bg-white dark:bg-slate-700"
              >
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skill Level</label>
          <select
            name="level"
            value={filters.level}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, level: e.target.value }))
            }
            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
          >
            <option value="">All</option>
            <option className="bg-white dark:bg-slate-700">Beginner</option>
            <option className="bg-white dark:bg-slate-700">Intermediate</option>
            <option className="bg-white dark:bg-slate-700">Expert</option>
          </select>
        </div>
        <div>
        <label htmlFor="sort-by" className="block text-sm font-medium mb-1">Sort By</label>
        <select
          id="sort-by"
          name="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
        >
          <option value="createdAt">Newest</option>
          <option value="averageRating">Top Rated</option>
        </select>
      </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
          Filter
         </button>
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
        {error && <p className="text-red-500 text-center font-semibold mb-4">{error}</p>}
      </form>
      <Suspense fallback={
          <div className="mb-8 px-4 py-6 w-full md:w-[80%] mx-auto h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg animate-pulse" />
        }
      >
        <UserSearch />
      </Suspense>

      {currentSearch && !loading && (
        <h2 className="text-2xl font-bold mb-4">
          Showing results for:{" "}
          <span className="text-blue-600">{currentSearch}</span>
        </h2>
      )}

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-200 dark:bg-slate-700 h-48 rounded-lg"
              />
            ))}
          </div>
        }
      >
        {loading && skills.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <SkillCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <p className="text-center p-10 text-white-500">{error}</p>
        ) : skills.length > 0 ? (
          <>
            <div
              id="search-results"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sortedSkills.map((skill) => (
               <SkillCard key={skill._id} skill={skill} />))}
            </div>
            <div className="text-center mt-8">
              {hasMore ? (
                <button
                  onClick={loadMoreSkills}
                  disabled={loading}
                  className="px-6 py-2 bg-white dark:bg-slate-700 font-semibold rounded-md disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More Skills"}
                </button>
              ) : (
                skills.length > 6 && (
                  <button
                    onClick={handleShowLess}
                    className="px-6 py-2 bg-white dark:bg-slate-700 font-semibold rounded-md"
                  >
                    Show Less
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <p className="text-center p-10 text-slate-500">
            {currentSearch ? "No skills found." : "No skills posted yet."}
          </p>
        )}
      </Suspense>

      <LazyLoad placeholderHeight="h-96">
        <div className="mt-16 text-center">
          {(searchedKeyword ||
            (!searchedKeyword &&
              youtubeVideos.length === 0 &&
              youtubePlaceholders.length > 0)) && (
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
              {youtubeVideos.map((video) => (
                <a
                  key={video.id.videoId || video.id}
                  href={`https://www.youtube.com/watch?v=${
                    video.id.videoId || video.id
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden group"
                >
                  <img
                    src={video.snippet.thumbnails.high.url}
                    alt={video.snippet.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-accent-500">
                      {video.snippet.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {video.snippet.channelTitle}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {searchedKeyword ? (
                <p className="text-slate-500 italic">
                  No tutorials found for this topic. It may be an invalid or
                  inappropriate search.
                </p>
              ) : (
                youtubePlaceholders.map((topic, index) => (
                  <a
                    key={index}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      topic
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-sm font-semibold rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    {topic}
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </LazyLoad>

      <LazyLoad>
        <RecommendedSkills />
      </LazyLoad>

      <div className="mt-16 text-center">
        <h2 className="text-3xl font-bold mb-8">How SkillSwap Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
              <SearchIcon className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Find a Skill</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Browse or search for a skill you want to learn from our talented
              community.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
              <ArrowsRightLeftIcon className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Propose a Swap</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Use your Swap Credits to propose an exchange. You earn credits by
              offering your own skills.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Connect & Learn</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Once your proposal is accepted, connect with the user to learn
              your new skill!
            </p>
          </div>
        </div>
      </div>
      {showScrollButton && skills.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={scrollToResults}
            className="p-3 bg-blue-600 text-white rounded-full shadow-lg animate-bounce hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Scroll to results"
          >
            <ArrowDownCircleIcon className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
};
export default Home;
