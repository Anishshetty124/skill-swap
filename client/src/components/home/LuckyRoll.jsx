import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

// Single die face with shake animation when rolling starts
const Die = ({ value, isShaking }) => {
    const dots = Array.from({ length: value }, (_, i) => (
        <div key={i} className="w-3 h-3 bg-blue-600 rounded-full"></div>
    ));

    return (
        <motion.div
            className="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center p-2 gap-1 flex-wrap"
            animate={{
                rotate: 360,
                x: isShaking ? [0, 5, -5, 5, -5, 0] : 0,
                transition: { duration: 0.5, ease: "easeInOut" }
            }}
        >
            {dots}
        </motion.div>
    );
};

const LuckyRoll = () => {
  const { user, updateUserState } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [prize, setPrize] = useState(null);
  const [dice, setDice] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Calculate time left until next roll (midnight)
  const updateTimeLeft = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24,0,0,0);
    setTimeLeft(Math.max(0, Math.floor((tomorrow - now) / 1000))); // seconds
  };

  const checkStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/rewards/status');
      setIsAvailable(response.data.data.isAvailable);
      if (!response.data.data.isAvailable) updateTimeLeft();
    } catch (error) {
      console.error("Failed to check reward status.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Update countdown every second if unavailable
  useEffect(() => {
    if (!isAvailable) {
      const interval = setInterval(() => {
        updateTimeLeft();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAvailable]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  // Progress % of day elapsed for progress bar
  const dayProgressPercent = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    const end = new Date(now);
    end.setHours(24,0,0,0);
    return ((now - start) / (end - start)) * 100;
  };

  const handleRoll = async () => {
    setIsRolling(true);
    setPrize(null);
    setShowConfetti(false);

    // Animate the die for 4 seconds
    const rollAnimation = setInterval(() => {
        setDice(Math.floor(Math.random() * 6) + 1);
    }, 100);

    try {
      const response = await apiClient.post('/rewards/claim');
      const earnedPrize = response.data.data.prize;
      
      setTimeout(() => {
        clearInterval(rollAnimation);
        setPrize(earnedPrize);
        toast.success(`You won ${earnedPrize} credits!`);
        updateUserState({ swapCredits: response.data.data.newCreditTotal });
        setIsAvailable(false);
        setIsRolling(false);
        setShowConfetti(true);
      }, 4000);

    } catch (error) {
      clearInterval(rollAnimation);
      toast.error(error.response?.data?.message || "Failed to claim reward.");
      setIsRolling(false);
    }
  };

  if (isLoading) {
    return <div className="w-full p-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse h-48"></div>;
  }

  if (!isAvailable) {
    return (
        <div className="text-center p-8 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg max-w-md mx-auto">
            <h3 className="font-bold text-2xl mb-4">Come Back Tomorrow!</h3>
            <p className="text-sm text-slate-500 mb-4">You've already claimed your daily reward. A new one will be available soon.</p>
            <p className="font-mono text-lg text-blue-600 mb-6">Next roll in: {formatTime(timeLeft)}</p>
            
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              Stay tuned! Each day brings a new chance to boost your Swap Credits. Don’t miss out!
            </p>
        </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-2xl shadow-xl text-center relative overflow-hidden max-w-lg mx-auto border-4 border-blue-300/40 hover:border-blue-400 transition-all duration-300">
      <h2 className="text-3xl font-extrabold mb-2 tracking-wide drop-shadow-md">Daily Lucky Roll</h2>
      <p className="opacity-90 mb-6 text-lg font-semibold drop-shadow-sm">Feeling lucky? Roll the dice once a day to win free Swap Credits!</p>
      
      <div className="my-8 flex justify-center items-center gap-4 relative">
        <Die value={dice} isShaking={isRolling} />
        <AnimatePresence>
          {prize && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-full px-4"
            >
                <h3 className="font-bold text-4xl drop-shadow-lg text-center select-none">🎉 You Won {prize} Credits! 🎉</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={handleRoll}
        disabled={isRolling}
        className="px-10 py-4 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-slate-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed tracking-wide text-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isRolling ? 'Rolling...' : "Roll Now!"}
      </motion.button>

      <p className="mt-6 text-sm opacity-80 max-w-xs mx-auto">
        💡 Pro tip: Come back every day and keep rolling for more Swap Credits!
      </p>

      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
    </div>
  );
};

export default LuckyRoll;
