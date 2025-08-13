import React, { useState } from 'react';
import apiClient from '../../api/axios';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/solid';

const ReportUserModal = ({ isOpen, onClose, reportedUser, conversationId }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for the report.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/messages/report/${conversationId}`, { reason });
      toast.success("Report submitted successfully. Our team will review it.");
      onClose(); // Close the modal on success
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">Report User</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={reportedUser.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${reportedUser.firstName} ${reportedUser.lastName}`} 
                alt={reportedUser.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p>You are reporting:</p>
                <p className="font-semibold">{reportedUser.firstName} {reportedUser.lastName} (@{reportedUser.username})</p>
              </div>
            </div>
            <label htmlFor="reason" className="block text-sm font-medium mb-2">Reason for report:</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide specific details about the issue (e.g., spam, harassment, inappropriate content)."
              className="w-full h-32 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
              maxLength="500"
              required
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{reason.length}/500</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserModal;
