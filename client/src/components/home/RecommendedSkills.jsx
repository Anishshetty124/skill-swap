import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import SkillCard from '../skills/SkillCard';
import SkillCardSkeleton from '../skills/SkillCardSkeleton';
import { useAuth } from '../../context/AuthContext';

const RecommendedSkills = () => {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
  if (!isAuthenticated || !token) {
    setLoading(false);
    return;
  }
    setLoading(true);
    apiClient.get('/skills/recommendations')
      .then(response => {
        setRecommendations(response.data.data);
      })
      .catch(error => {
        console.error("Failed to fetch recommendations", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => <SkillCardSkeleton key={index} />)}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; 
  }

  return (
    <div className="mt-16 text-center">
      <h2 className="text-3xl font-bold mb-8">
        {isAuthenticated ? "recommended skills for You" : "Recently Added"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(skill => (
          <SkillCard key={skill._id} skill={skill} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedSkills;