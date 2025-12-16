'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type LumiMood = 
  | 'happy' 
  | 'excited' 
  | 'thinking' 
  | 'encouraging' 
  | 'celebrating' 
  | 'curious' 
  | 'proud'
  | 'neutral'
  | 'waving';

interface LumiProps {
  mood?: LumiMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showMessage?: boolean;
  animate?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 160,
};

const moodColors = {
  happy: { primary: '#6366f1', secondary: '#818cf8', glow: '#c7d2fe' },
  excited: { primary: '#f59e0b', secondary: '#fbbf24', glow: '#fef3c7' },
  thinking: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#ddd6fe' },
  encouraging: { primary: '#10b981', secondary: '#34d399', glow: '#d1fae5' },
  celebrating: { primary: '#ec4899', secondary: '#f472b6', glow: '#fce7f3' },
  curious: { primary: '#06b6d4', secondary: '#22d3ee', glow: '#cffafe' },
  proud: { primary: '#f97316', secondary: '#fb923c', glow: '#ffedd5' },
  neutral: { primary: '#6366f1', secondary: '#818cf8', glow: '#e0e7ff' },
  waving: { primary: '#6366f1', secondary: '#818cf8', glow: '#c7d2fe' },
};

export default function Lumi({ 
  mood = 'neutral', 
  size = 'md', 
  message,
  showMessage = true,
  animate = true,
  onClick,
  className = ''
}: LumiProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const pixelSize = sizeMap[size];
  const colors = moodColors[mood];

  useEffect(() => {
    if (!animate) return;
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, [animate]);

  const getEyeExpression = () => {
    if (blink) return { leftY: 0, rightY: 0, height: 2 };
    switch (mood) {
      case 'happy':
      case 'celebrating':
        return { leftY: -2, rightY: -2, height: 6, curved: true };
      case 'excited':
        return { leftY: 0, rightY: 0, height: 10, sparkle: true };
      case 'thinking':
        return { leftY: -3, rightY: 3, height: 8 };
      case 'curious':
        return { leftY: 2, rightY: 2, height: 10 };
      case 'encouraging':
      case 'proud':
        return { leftY: -1, rightY: -1, height: 8, curved: true };
      case 'waving':
        return { leftY: 0, rightY: 0, height: 8 };
      default:
        return { leftY: 0, rightY: 0, height: 8 };
    }
  };

  const getMouthExpression = () => {
    switch (mood) {
      case 'happy':
      case 'proud':
        return 'smile';
      case 'excited':
      case 'celebrating':
        return 'big-smile';
      case 'thinking':
        return 'hmm';
      case 'curious':
        return 'o';
      case 'encouraging':
        return 'gentle-smile';
      case 'waving':
        return 'smile';
      default:
        return 'neutral';
    }
  };

  const eyeExpr = getEyeExpression();
  const mouthExpr = getMouthExpression();

  const bounceAnimation = animate ? {
    y: [0, -4, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  const celebrateAnimation = mood === 'celebrating' ? {
    rotate: [-5, 5, -5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  const wavingAnimation = mood === 'waving' ? {
    rotate: [0, 14, -8, 14, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <motion.div
        className="relative cursor-pointer"
        animate={{ ...bounceAnimation, ...celebrateAnimation }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl opacity-50"
          style={{ backgroundColor: colors.glow }}
          animate={mood === 'celebrating' ? {
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* Main body */}
        <svg
          viewBox="0 0 100 100"
          className="relative z-10"
          style={{ width: pixelSize, height: pixelSize }}
        >
          {/* Body gradient */}
          <defs>
            <radialGradient id={`lumi-gradient-${mood}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor={colors.primary} />
            </radialGradient>
            <filter id="lumi-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Main circle body */}
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill={`url(#lumi-gradient-${mood})`}
            filter="url(#lumi-shadow)"
          />

          {/* Highlight */}
          <ellipse
            cx="35"
            cy="35"
            rx="12"
            ry="8"
            fill="white"
            opacity="0.3"
          />

          {/* Left eye */}
          <motion.g
            animate={mood === 'thinking' ? { x: [0, -2, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {eyeExpr.curved ? (
              <path
                d="M 30 45 Q 35 38 40 45"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <ellipse
                cx="35"
                cy={45 + eyeExpr.leftY}
                rx="6"
                ry={eyeExpr.height / 2}
                fill="white"
              />
            )}
            {eyeExpr.sparkle && (
              <circle cx="37" cy="42" r="2" fill="white" opacity="0.8" />
            )}
          </motion.g>

          {/* Right eye */}
          <motion.g
            animate={mood === 'thinking' ? { x: [0, 2, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {eyeExpr.curved ? (
              <path
                d="M 60 45 Q 65 38 70 45"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <ellipse
                cx="65"
                cy={45 + eyeExpr.rightY}
                rx="6"
                ry={eyeExpr.height / 2}
                fill="white"
              />
            )}
            {eyeExpr.sparkle && (
              <circle cx="67" cy="42" r="2" fill="white" opacity="0.8" />
            )}
          </motion.g>

          {/* Mouth */}
          <g>
            {mouthExpr === 'smile' && (
              <path
                d="M 35 62 Q 50 72 65 62"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            )}
            {mouthExpr === 'big-smile' && (
              <>
                <path
                  d="M 32 60 Q 50 78 68 60"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 35 62 Q 50 72 65 62"
                  fill="white"
                  opacity="0.3"
                />
              </>
            )}
            {mouthExpr === 'gentle-smile' && (
              <path
                d="M 38 62 Q 50 68 62 62"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            )}
            {mouthExpr === 'hmm' && (
              <ellipse cx="50" cy="65" rx="5" ry="3" fill="white" opacity="0.8" />
            )}
            {mouthExpr === 'o' && (
              <circle cx="50" cy="65" r="6" fill="white" opacity="0.9" />
            )}
            {mouthExpr === 'neutral' && (
              <line x1="42" y1="65" x2="58" y2="65" stroke="white" strokeWidth="3" strokeLinecap="round" />
            )}
          </g>

          {/* Blush marks for happy moods */}
          {(mood === 'happy' || mood === 'celebrating' || mood === 'proud') && (
            <>
              <ellipse cx="25" cy="55" rx="6" ry="3" fill="#ff9999" opacity="0.4" />
              <ellipse cx="75" cy="55" rx="6" ry="3" fill="#ff9999" opacity="0.4" />
            </>
          )}

          {/* Thinking bubbles */}
          {mood === 'thinking' && (
            <motion.g
              animate={{ opacity: [0.5, 1, 0.5], y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <circle cx="80" cy="25" r="4" fill="white" opacity="0.6" />
              <circle cx="88" cy="15" r="3" fill="white" opacity="0.4" />
              <circle cx="93" cy="8" r="2" fill="white" opacity="0.3" />
            </motion.g>
          )}

          {/* Stars for excited/celebrating */}
          {(mood === 'excited' || mood === 'celebrating') && (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '50px 50px' }}
            >
              <motion.text
                x="15"
                y="20"
                fontSize="12"
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ✨
              </motion.text>
              <motion.text
                x="78"
                y="25"
                fontSize="10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              >
                ⭐
              </motion.text>
            </motion.g>
          )}
        </svg>

        {/* Waving hand for waving mood */}
        {mood === 'waving' && (
          <motion.div
            className="absolute -right-2 top-1/2"
            animate={wavingAnimation}
            style={{ transformOrigin: 'bottom center', fontSize: pixelSize * 0.3 }}
          >
            👋
          </motion.div>
        )}
      </motion.div>

      {/* Speech bubble with message */}
      <AnimatePresence>
        {message && showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="mt-3 relative max-w-xs"
          >
            <div className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45" />
              <p className="text-sm text-gray-700 text-center relative z-10">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
