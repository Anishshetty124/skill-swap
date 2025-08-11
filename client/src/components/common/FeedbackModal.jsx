import React, { useState } from 'react';
import apiClient from '../../api/axios';
import { toast } from 'react-toastify';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/solid';

const FeedbackModal = ({ isOpen, onClose }) => {
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
      setMessage('');
      onClose(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Submit Feedback</h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          Found a bug or have a suggestion? We'd love to hear it!
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Feedback Type</label>
                <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600"
                >
                <option value="suggestion">Suggestion</option>
                <option value="bug">Bug Report</option>
                <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Your Message</label>
                <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please be as detailed as possible..."
                rows="5"
                required
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600"
                ></textarea>
            </div>
          <div className="flex justify-end pt-4">
            <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? 'Sending...' : 'Send Feedback'}
                <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
