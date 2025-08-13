import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

const SplashScreen = () => {
  const [isStandalone, setIsStandalone] = useState(false);

useEffect(() => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    setIsStandalone(true);
  }
}, []);
  return (
     <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#121212' }} 
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-32 md:w-48"
        animate={isStandalone ? {} : { y: ["0%", "-5%", "0%"] }}
        transition={isStandalone ? {} : { duration: 3, ease: "easeInOut", repeat: Infinity }}
      >
        <img 
          src="/logo.png" 
          alt="SkillSwap Logo" 
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
