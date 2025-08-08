import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Badge from '../profile/Badge';

const BadgeNotificationModal = ({ isOpen, onClose, badgeName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center relative"
      >
        {/* Confetti-like background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
            <div className="absolute top-1/4 left-3/4 w-2 h-2 bg-blue-300 rounded-full animate-ping delay-100"></div>
            <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-green-300 rounded-full animate-ping delay-200"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-purple-300 rounded-full animate-ping delay-300"></div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 z-10">
            <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="relative">
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-slate-500 mb-6">You've earned a new badge!</p>
            
            <div className="flex justify-center mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <Badge name={badgeName} />
                </motion.div>
            </div>

            <Link 
                to="/profile/me" // A placeholder link, assuming you'll have a route for the current user's profile
                onClick={onClose}
                className="w-full px-6 py-3 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700"
            >
                View My Profile
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default BadgeNotificationModal;
