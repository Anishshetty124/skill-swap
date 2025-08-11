import React from 'react';
import { motion } from 'framer-motion';


const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* This container now controls the logo's size */}
      <motion.div
        className="w-24 md:w-32" // Base size for mobile, larger for desktop
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <img 
          src="/logo.png" 
          alt="SkillSwap Logo" 
          // The image now fills its container, which has a max width
          className="w-full h-auto rounded-2xl" 
        />
      </motion.div>
      <p className="mt-4 text-lg font-semibold text-slate-300">
        SkillSwap
      </p>
    </motion.div>
  );
};

export default SplashScreen;
