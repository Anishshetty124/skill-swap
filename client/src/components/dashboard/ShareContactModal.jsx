import React, { useState } from 'react';

const ShareContactModal = ({ isOpen, onClose, onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ phone, note });
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Accept & Share Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Optionally, share your contact details to make the swap easier to coordinate.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone Number (Optional)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 9876543210" className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Note (Optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="3" placeholder="e.g., 'Best to call after 5 PM.'" className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">Skip</button>
            <button type="submit" className="px-4 py-2 rounded-md font-semibold text-white bg-accent-600 hover:bg-accent-700">Accept & Share</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareContactModal;