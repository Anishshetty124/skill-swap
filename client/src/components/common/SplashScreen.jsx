import React from 'react';
import { motion } from 'framer-motion'; // Framer Motion is already in your project

/**
 * A full-screen splash/loading component with an animated logo.
 * It's designed to be shown on the initial load of the PWA.
 */
const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
       <img src="/logo.png" alt="SkillSwap Logo" className="h-25 w-25 rounded-2xl" />
      </motion.div>
      <p className="mt-4 text-lg font-semibold text-slate-300">
        SkillSwap
      </p>
    </motion.div>
  );
};

export default SplashScreen;
