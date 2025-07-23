import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import MapComponent from '../components/map/MapComponent';

const Home = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('card'); // 'card' or 'map'

  const fetchSkills = async (url = '/skills') => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(url);
      const data = response.data.data;
      setSkills(Array.isArray(data) ? data : data.skills);
    } catch (err) {
      console.error(err);
      setError('Oops! We’re having trouble loading skills right now. Please check your internet connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchSkills(`/skills/nearby?lat=${latitude}&lon=${longitude}`);
      },
      () => {
        setError("Unable to retrieve your location. Please enable location services.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="px-4 sm:px-8 py-6 max-w-screen-xl mx-auto">
      {/* Page Heading */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Discover Skills Around You</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore local talents, exchange skills, and connect with people nearby. You can offer something you know and request something you want to learn.
        </p>
      </div>

      {/* Controls: View Toggle & Find Nearby */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('card')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                view === 'card'
                  ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Card
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                view === 'map'
                  ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Map
            </button>
          </div>
          <button
            onClick={handleFindNearby}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 transition-colors disabled:bg-blue-400"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Find Near Me</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-10 text-gray-600 dark:text-gray-300">
          <p>🔄 Loading skills near you...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-700 rounded-md px-4">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Something went wrong</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {error}
          </p>
          <button
            onClick={() => fetchSkills()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No skills found around you.</p>
          <p className="text-gray-600 dark:text-gray-300">Be the first to share your skill and start helping others in your area!</p>
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <SkillCard key={skill._id} skill={skill} />
          ))}
        </div>
      ) : (
        <MapComponent skills={skills} />
      )}
    </div>
  );
};

export default Home;
