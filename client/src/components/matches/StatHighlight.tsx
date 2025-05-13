import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StatHighlightProps {
  label: string;
  homeValue: number;
  awayValue: number;
  isPrimary?: boolean;
}

const StatHighlight: React.FC<StatHighlightProps> = ({ 
  label, 
  homeValue, 
  awayValue, 
  isPrimary = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Safety measure - disable animations if errors occur
  useEffect(() => {
    try {
      setIsMounted(true);
      
      // Error handler to disable animations
      const handleError = () => {
        console.log("Disabling animations in StatHighlight due to error");
        setAnimationsEnabled(false);
      };
      
      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        setIsMounted(false);
      };
    } catch (error) {
      console.error("Error in StatHighlight animation setup:", error);
      setAnimationsEnabled(false);
    }
  }, []);
  
  // Calculate the total value and percentages safely
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? Math.min(Math.max(Math.round((homeValue / total) * 100), 0), 100) : 50;
  const awayPercent = total > 0 ? Math.min(Math.max(Math.round((awayValue / total) * 100), 0), 100) : 50;
  
  // Determine winner for the stat
  const homeWins = homeValue > awayValue;
  const awayWins = awayValue > homeValue;
  const isTied = homeValue === awayValue;
  
  // Get gradient colors based on if it's primary stat and who's winning
  const getGradientColors = () => {
    if (isPrimary) {
      return {
        home: homeWins ? 'from-blue-600' : 'from-gray-400',
        away: awayWins ? 'to-red-600' : 'to-gray-400'
      };
    }
    return {
      home: homeWins ? 'from-blue-500' : 'from-gray-300',
      away: awayWins ? 'to-red-500' : 'to-gray-300'
    };
  };
  
  const colors = getGradientColors();
  
  // Non-animated version for when animations are disabled
  if (!animationsEnabled) {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <div className="font-semibold">
            {homeValue}
          </div>
          <div className="text-xs text-gray-500 uppercase">
            {label}
          </div>
          <div className="font-semibold">
            {awayValue}
          </div>
        </div>
        
        <div className="h-2 w-full flex rounded-full overflow-hidden">
          <div 
            className={`${colors.home} h-full`}
            style={{ width: `${homePercent}%` }}
          />
          <div 
            className={`${colors.away} h-full`}
            style={{ width: `${awayPercent}%` }}
          />
        </div>
        
        {isHovered && (
          <div className="mt-1 text-xs text-center">
            <span 
              className={`inline-block transition-all duration-300 ${
                homeWins ? 'text-blue-600 font-semibold' : 
                awayWins ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {isTied ? 'Equal stats' : homeWins ? 'Home advantage' : 'Away advantage'}
            </span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className="mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center mb-1">
        <div className={`font-semibold transition-all duration-300 ${homeWins && isHovered ? 'scale-110 text-blue-600' : ''}`}>
          {homeValue}
        </div>
        <div className="text-xs text-gray-500 uppercase">
          {label}
        </div>
        <div className={`font-semibold transition-all duration-300 ${awayWins && isHovered ? 'scale-110 text-red-600' : ''}`}>
          {awayValue}
        </div>
      </div>
      
      <div className="h-2 w-full flex rounded-full overflow-hidden">
        <motion.div 
          className={`${colors.home} h-full`}
          style={{ width: 0 }} // Start at 0 width
          initial={{ width: 0 }}
          animate={isMounted ? { width: `${homePercent}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.div 
          className={`${colors.away} h-full`}
          style={{ width: 0 }} // Start at 0 width
          initial={{ width: 0 }}
          animate={isMounted ? { width: `${awayPercent}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      {/* Animated highlight when hovered */}
      {isHovered && (
        <div className="mt-1 text-xs text-center">
          <span 
            className={`inline-block transition-all duration-300 ${
              homeWins ? 'text-blue-600 font-semibold' : 
              awayWins ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {isTied ? 'Equal stats' : homeWins ? 'Home advantage' : 'Away advantage'}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatHighlight;