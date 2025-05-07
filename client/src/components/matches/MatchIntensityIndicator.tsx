import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface MatchIntensityIndicatorProps {
  intensity: number; // 0-100
  isLive: boolean;
}

const MatchIntensityIndicator: React.FC<MatchIntensityIndicatorProps> = ({
  intensity = 50,
  isLive = true
}) => {
  // Normalize intensity between 0-100
  const normalizedIntensity = Math.max(0, Math.min(100, intensity));
  
  // Determine color based on intensity
  const getIntensityColor = () => {
    if (normalizedIntensity >= 80) return 'text-red-500';
    if (normalizedIntensity >= 60) return 'text-orange-500';
    if (normalizedIntensity >= 40) return 'text-yellow-500';
    if (normalizedIntensity >= 20) return 'text-blue-500';
    return 'text-gray-400';
  };
  
  // Determine pulse speed based on intensity
  const getPulseSpeed = () => {
    if (normalizedIntensity >= 80) return 0.5;
    if (normalizedIntensity >= 60) return 0.8;
    if (normalizedIntensity >= 40) return 1.2;
    if (normalizedIntensity >= 20) return 1.5;
    return 2;
  };
  
  // If match is not live, we show a static indicator
  if (!isLive) {
    return (
      <div className="flex items-center space-x-1 opacity-60">
        <Zap className="w-4 h-4 text-gray-400" />
        <div className="text-xs text-gray-500">Upcoming</div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-1">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: getPulseSpeed(),
          ease: "easeInOut"
        }}
        className={`flex items-center ${getIntensityColor()}`}
      >
        <Zap className="w-4 h-4" />
        
        {/* Intensity rays - only show for high intensity matches */}
        {normalizedIntensity >= 60 && (
          <div className="relative">
            {Array.from({ length: Math.floor(normalizedIntensity / 20) }).map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full ${getIntensityColor()}`}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ 
                  x: [0, (i % 2 === 0 ? 5 : -5) * (1 + i % 3)],
                  y: [0, (i % 3 === 0 ? 5 : -5) * (1 + i % 2)],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1 + (i * 0.2),
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
      
      <div className="text-xs font-medium">
        {normalizedIntensity >= 80 && 'High Intensity!'}
        {normalizedIntensity >= 60 && normalizedIntensity < 80 && 'Exciting Match'}
        {normalizedIntensity >= 40 && normalizedIntensity < 60 && 'Active Match'}
        {normalizedIntensity >= 20 && normalizedIntensity < 40 && 'Moderate Pace'}
        {normalizedIntensity < 20 && 'Slow Pace'}
      </div>
    </div>
  );
};

export default MatchIntensityIndicator;