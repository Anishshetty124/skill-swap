import React from 'react';
import { GiftIcon } from '@heroicons/react/24/solid';

const WelcomeCreditsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
        <GiftIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome to SkillSwap!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">To get you started, we've added</p>
        <p className="text-5xl font-extrabold text-slate-800 dark:text-white mb-6">10 Swap Credits</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">to your account for free. Use them to acquire new skills from others.</p>
        <button
          onClick={onClose}
          className="w-full px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600"
        >
          Start Swapping!
        </button>
      </div>
    </div>
  );
};

export default WelcomeCreditsModal;