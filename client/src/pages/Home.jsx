import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import MapComponent from '../components/map/MapComponent';

const Home = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('card'); // 'card' or 'map'

  // Reusable function to fetch skills from a given URL
  const fetchSkills = async (url = '/skills') => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(url);
      const data = response.data.data;
      
      // Handle different response structures from the backend
      setSkills(Array.isArray(data) ? data : data.skills);
    } catch (err) {
      setError('Failed to load skills. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all skills when the component first loads
  useEffect(() => {
    fetchSkills();
  }, []);

  // Handler for the "Find Near Me" button
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    
    // Use the browser's Geolocation API to get the user's position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Fetch skills using the user's coordinates
        fetchSkills(`/skills/nearby?lat=${latitude}&lon=${longitude}`);
      },
      () => {
        setError("Unable to retrieve your location. Please enable location services.");
        setLoading(false);
      }
    );
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Discover Skills</h1>
        <div className="flex items-center gap-4">
          
          {/* View Toggle Buttons */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button 
              onClick={() => setView('card')} 
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'card' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Card
            </button>
            <button 
              onClick={() => setView('map')} 
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'map' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Map
            </button>
          </div>
          
          {/* Find Nearby Button */}
          <button 
            onClick={handleFindNearby}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 transition-colors disabled:bg-blue-400"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Find Near Me</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering for Loading, Error, and Content */}
      {loading ? (
        <p className="text-center p-10">Loading skills...</p>
      ) : error ? (
        <p className="text-center p-10 text-red-500">{error}</p>
      ) : (
        view === 'card' ? (
          skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => <SkillCard key={skill._id} skill={skill} />)}
            </div>
          ) : (
            <p className="text-center p-10 text-gray-500">No skills found. Try another search or be the first to post!</p>
          )
        ) : (
          <MapComponent skills={skills} />
        )
      )}
    </div>
  );
};

export default Home;