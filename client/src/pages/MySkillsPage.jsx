import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import { useAuth } from '../context/AuthContext';

const MySkillsPage = () => {
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      const fetchMySkills = async () => {
        try {
          setLoading(true);
          // Use the existing endpoint to fetch skills by userId
          const response = await apiClient.get(`/skills?userId=${user._id}`);
          setMySkills(response.data.data.skills);
        } catch (err) {
          setError('Failed to load your skills.');
        } finally {
          setLoading(false);
        }
      };
      fetchMySkills();
    }
  }, [user?._id]);

  if (loading) return <p className="text-center p-10">Loading your skills...</p>;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Posted Skills</h1>
      {mySkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mySkills.map((skill) => (
            <SkillCard key={skill._id} skill={skill} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">You have not posted any skills yet.</p>
      )}
    </div>
  );
};

export default MySkillsPage;