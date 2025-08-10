import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const segments = 6;
const segmentAngle = 360 / segments;
const radius = 150;
const center = radius + 10; // add some padding

// Helper to create arc path for segments
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    x,
    y,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

// Convert polar coords to Cartesian
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

const colors = [
  "#3b82f6",
  "#60a5fa",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#2563eb",
];

const SpinWheel = ({ prizeIndex, isSpinning }) => {
  const spins = 5;
  const segmentCenterAngle = prizeIndex * segmentAngle + segmentAngle / 2;
  const finalRotation = spins * 360 - segmentCenterAngle;

  return (
    <div className="relative w-[320px] h-[320px] mx-auto">
      {/* Pointer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%) rotate(180deg)",
          width: 0,
          height: 0,
          borderLeft: "20px solid transparent",
          borderRight: "20px solid transparent",
          borderBottom: "40px solid #2563eb",
          filter: "drop-shadow(0 0 3px rgba(0,0,0,0.3))",
          zIndex: 10,
        }}
      />

      <motion.svg
        width={center * 2}
        height={center * 2}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
        style={{ cursor: isSpinning ? "wait" : "pointer" }}
        animate={{ rotate: isSpinning ? finalRotation : 0 }}
        transition={{ duration: isSpinning ? 4 : 0, ease: "easeOut" }}
      >
        {/* Draw segments */}
        {[...Array(segments)].map((_, i) => {
          const startAngle = i * segmentAngle;
          const endAngle = startAngle + segmentAngle;
          const path = describeArc(center, center, radius, startAngle, endAngle);
          // Calculate text position (mid-angle of segment)
          const textAngle = startAngle + segmentAngle / 2;
          const textPos = polarToCartesian(
            center,
            center,
            radius * 0.65,
            textAngle
          );
          return (
            <g key={i}>
              <path d={path} fill={colors[i % colors.length]} stroke="white" strokeWidth="2" />
              <text
                x={textPos.x}
                y={textPos.y}
                fill="white"
                fontSize="28"
                fontWeight="bold"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        {/* Circle center to cover pointer base */}
        <circle cx={center} cy={center} r={30} fill="#2563eb" />
      </motion.svg>
    </div>
  );
};

const LuckyRoll = () => {
  const { user, updateUserState } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [prize, setPrize] = useState(null);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const updateTimeLeft = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    setTimeLeft(Math.max(0, Math.floor((tomorrow - now) / 1000)));
  };

  const checkStatus = useCallback(async () => {
    try {
      const response = await apiClient.get("/rewards/status");
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

  useEffect(() => {
    if (!isAvailable) {
      const interval = setInterval(() => {
        updateTimeLeft();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAvailable]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const dayProgressPercent = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    return ((now - start) / (end - start)) * 100;
  };

  const handleRoll = async () => {
    setIsRolling(true);
    setPrize(null);
    setShowConfetti(false);

    try {
      const response = await apiClient.post("/rewards/claim");
      const earnedPrizeIndex = response.data.data.prize;
      const earnedPrizeValue = earnedPrizeIndex + 1;

      setPrizeIndex(earnedPrizeIndex);

      setTimeout(() => {
        setPrize(earnedPrizeValue);
        toast.success(`You won ${earnedPrizeValue} credits!`);
        updateUserState({ swapCredits: response.data.data.newCreditTotal });
        setIsAvailable(false);
        setIsRolling(false);
        setShowConfetti(true);
      }, 4000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to claim reward.");
      setIsRolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse h-48"></div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="text-center p-8 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg max-w-md mx-auto">
        <h3 className="font-bold text-2xl mb-4">Come Back Tomorrow!</h3>
        <p className="text-sm text-slate-500 mb-4">
          You've already claimed your daily reward. A new one will be available soon.
        </p>
        <p className="font-mono text-lg text-blue-600 mb-6">Next roll in: {formatTime(timeLeft)}</p>
        <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${dayProgressPercent()}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          Stay tuned! Each day brings a new chance to boost your Swap Credits. Don’t miss out!
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-2xl shadow-xl text-center relative overflow-hidden max-w-lg mx-auto border-4 border-blue-300/40 hover:border-blue-400 transition-all duration-300">
      <h2 className="text-3xl font-extrabold mb-2 tracking-wide drop-shadow-md">Daily Lucky Roll</h2>
      <p className="opacity-90 mb-6 text-lg font-semibold drop-shadow-sm">
        Feeling lucky? Spin the wheel once a day to win free Swap Credits!
      </p>

      <div className="my-8 flex justify-center items-center gap-4 relative">
        <SpinWheel prizeIndex={prizeIndex} isSpinning={isRolling} />
        <AnimatePresence>
          {prize && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-full px-4"
            >
              <h3 className="font-bold text-4xl drop-shadow-lg text-center select-none">
                🎉 You Won {prize} Credits! 🎉
              </h3>
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
        {isRolling ? "Spinning..." : "Spin Now!"}
      </motion.button>

      <p className="mt-6 text-sm opacity-80 max-w-xs mx-auto">
        💡 Pro tip: Come back every day and keep spinning for more Swap Credits!
      </p>

      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
    </div>
  );
};

export default LuckyRoll;
