import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

const CreateSkillPage = () => {
  const [formData, setFormData] = useState({
    type: 'OFFER',
    title: '',
    description: '',
    category: '',
    level: 'Intermediate',
    availability: 'Flexible',
    location: 'Remote',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const skillCategories = ['Tech', 'Art', 'Music', 'Writing', 'Marketing', 'Language', 'Fitness', 'Cooking', 'Crafts'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.category) {
      setError('Please select a category.');
      return;
    }

    try {
      const response = await apiClient.post('/skills', formData);
      setSuccess('Skill posted successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/skills/${response.data.data._id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while posting the skill.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Post a New Skill</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">I want to:</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md">
            <option value="OFFER">Offer a Skill</option>
            <option value="REQUEST">Request a Skill</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md">
            <option value="">-- Select a Category --</option>
            {skillCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium">Skill Level</label>
          <select name="level" value={formData.level} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
        </div>
        
        <button type="submit" className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Post Skill
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-center text-red-500">{error}</p>}
      {success && <p className="mt-4 text-sm text-center text-green-500">{success}</p>}
    </div>
  );
};

export default CreateSkillPage;