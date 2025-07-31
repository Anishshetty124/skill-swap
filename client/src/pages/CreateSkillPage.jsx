import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axios';
import toast from 'react-hot-toast';

const CreateSkillPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const skillToClone = location.state?.skillToClone;

  const [formData, setFormData] = useState({
    type: 'OFFER',
    title: '',
    description: '',
    category: '',
    level: 'Intermediate',
    locationString: 'Remote',
    costInCredits: 1,
    desiredSkill: '',
  });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (skillToClone) {
      setFormData({
        type: skillToClone.type,
        title: skillToClone.title,
        description: skillToClone.description,
        category: skillToClone.category,
        level: skillToClone.level,
        locationString: skillToClone.locationString,
        costInCredits: skillToClone.costInCredits,
        desiredSkill: skillToClone.desiredSkill
      });
    }
  }, [skillToClone]);

  const skillCategories = ['Tech', 'Art', 'Music', 'Writing', 'Marketing', 'Language', 'Fitness', 'Cooking', 'Crafts'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/skills', formData);
      toast.success('Skill posted successfully!');
      navigate(`/skills/${response.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post skill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Post a Skill</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">I want to:</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md">
            <option value="OFFER">Offer a Skill</option>
            <option value="REQUEST">Request a Skill</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md">
            <option value="">-- Select a Category --</option>
            {skillCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows="4" 
            className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
          ></textarea>
        </div>
        
        {formData.type === 'OFFER' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">What I Want in Return (Optional)</label>
              <input 
                type="text" 
                name="desiredSkill"
                value={formData.desiredSkill} 
                onChange={handleChange} 
                placeholder="e.g., Help with a logo, guitar lessons..."
                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost in Swap Credits</label>
              <input 
                type="number" 
                name="costInCredits"
                value={formData.costInCredits} 
                onChange={handleChange} 
                min="0"
                className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
              />
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Skill Level</label>
          <select name="level" value={formData.level} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-blue-500 rounded-md hover:bg-accent-700 disabled:opacity-50">
          {loading ? 'Posting...' : 'Post Skill'}
        </button>
      </form>
    </div>
  );
};

export default CreateSkillPage;