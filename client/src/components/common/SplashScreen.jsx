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
      // Animation for fading out the splash screen
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        // Animation for the logo itself (a subtle pulse)
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        {/* Make sure your main logo is available at this path in the /public folder */}
        <img src="/logo.png" alt="SkillSwap Logo" className="h-24 w-24" />
      </motion.div>
      <p className="mt-4 text-lg font-semibold text-slate-300">
        SkillSwap
      </p>
    </motion.div>
  );
};

export default SplashScreen;
