import React, {useState} from 'react';
import apiClient from '../api/axios';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/solid';
import Spinner from './common/Spinner';

const ReportSkillModal = ({ isOpen, onClose, skill, onReportSuccess }) => {
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
            await apiClient.post(`/skills/${skill._id}/report`, { reason });
            toast.success("Report submitted successfully. Our team will review it.");
            if (onReportSuccess) onReportSuccess();
            onClose(); 
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
                    <h2 className="text-lg font-bold">Report Skill</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="mb-4">
                            <p>You are reporting the skill:</p>
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">{skill.title}</p>
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
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            {submitting ? <Spinner isButtonSpinner={true} /> : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportSkillModal;
