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
       <img src="/logo.png" alt="SkillSwap Logo" className="w-23 h-23 md:w-31 md:h-31 rounded-2xl" />
      </motion.div>
      <p className="mt-4 text-lg font-semibold text-slate-300">
        SkillSwap
      </p>
    </motion.div>
  );
};

export default SplashScreen;
