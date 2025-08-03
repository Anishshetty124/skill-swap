import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftEllipsisIcon, VideoCameraIcon, CalendarIcon, ShareIcon } from '@heroicons/react/24/outline';

const ShareContactModal = ({ isOpen, onClose, onSubmit, existingContactInfo }) => {
  const { user } = useAuth();
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    meetingLink: '',
    meetingTime: '',
    other: '',
    note: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (existingContactInfo) {
        setContactInfo(existingContactInfo);
      } else {
        // Pre-fill phone and email if available
        setContactInfo(prev => ({ 
          ...prev, 
          phone: user?.mobileNumber || '',
          email: user?.email || '' 
        }));
      }
    } else {
      // Reset form when closed
      setContactInfo({ phone: '', email: '', meetingLink: '', meetingTime: '', other: '', note: '' });
    }
  }, [isOpen, existingContactInfo, user]);

  const handleChange = (e) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(contactInfo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {existingContactInfo ? 'Edit Contact Info' : 'Accept Proposal & Share Info'}
        </h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          Share your contact and meeting details so the other user can connect with you.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <PhoneIcon className="h-5 w-5 text-slate-400 absolute top-3.5 left-4"/>
            <input 
              type="tel" 
              name="phone" 
              value={contactInfo.phone} 
              onChange={handleChange} 
              placeholder="10-Digit Mobile Number" 
              required 
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit mobile number"
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg"
            />
          </div>
          <div className="relative">
            <EnvelopeIcon className="h-5 w-5 text-slate-400 absolute top-3.5 left-4"/>
            <input 
              type="email" 
              name="email" 
              value={contactInfo.email} 
              onChange={handleChange} 
              placeholder="Email Address" 
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg"
            />
          </div>
          <div className="relative">
            <VideoCameraIcon className="h-5 w-5 text-slate-400 absolute top-3.5 left-4"/>
            <input type="url" name="meetingLink" value={contactInfo.meetingLink} onChange={handleChange} placeholder="Zoom/Google Meet Link (Optional)" className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg"/>
          </div>
          <div className="relative">
            <CalendarIcon className="h-5 w-5 text-slate-400 absolute top-3.5 left-4"/>
            <input type="datetime-local" name="meetingTime" value={contactInfo.meetingTime} onChange={handleChange} placeholder="Suggested Meeting Time (Optional)" className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg"/>
          </div>
          <div className="relative">
            <ShareIcon className="h-5 w-5 text-slate-400 absolute top-3.5 left-4"/>
            <input
              type="text"
              name="other"
              value={contactInfo.other}
              onChange={handleChange}
              placeholder="Other (e.g., Discord, Instagram)"
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg"
            />
          </div>
          <div className="relative">
             <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-slate-400 absolute top-3.5 left-4"/>
            <textarea name="note" value={contactInfo.note} onChange={handleChange} placeholder="Add a short note..." rows="3" className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg"></textarea>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 rounded-md font-semibold text-white bg-accent-600 hover:bg-accent-700">
              {existingContactInfo ? 'Save Changes' : 'Accept & Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareContactModal;
