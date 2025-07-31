import React from 'react';
import { Link } from 'react-router-dom';
import { GiftIcon } from '@heroicons/react/24/solid';

const WelcomePage = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <GiftIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Welcome to SkillSwap!</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4">To get you started, we've added</p>
        <p className="text-5xl font-extrabold text-slate-800 dark:text-white mb-6">10 Swap Credits</p>
        <p className="text-slate-500 dark:text-slate-400 mb-6">to your account for free. Use them to acquire new skills from others.</p>
        <Link 
          to="/login"
          className="w-full inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-accent-700"
        >
          Continue to Login
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;