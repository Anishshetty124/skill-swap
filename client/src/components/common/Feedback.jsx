import React, { useState } from 'react';
import apiClient from '../../api/axios';
import { toast } from 'react-toastify';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const Feedback = () => {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message before sending feedback.");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/feedback', { feedbackType, message });
      toast.success(response.data.message);
      setMessage(''); // Clear the form on success
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 py-12">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h2 className="text-3xl font-bold mb-4">Have Feedback?</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          We'd love to hear it! Let us know if you've found a bug or have a suggestion for a new feature.
        </p>
        <form onSubmit={handleSubmit} className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg shadow-inner">
          {/* --- THIS IS THE CORRECTED RESPONSIVE LAYOUT --- */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full md:w-1/3 p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700"
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              rows="3"
              required
              className="w-full md:flex-grow p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? 'Sending...' : 'Send Feedback'}
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
