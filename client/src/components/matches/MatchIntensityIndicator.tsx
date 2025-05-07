import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    if (normalizedIntensity >= 80) return 'bg-red-500 text-white';
    if (normalizedIntensity >= 60) return 'bg-orange-500 text-white';
    if (normalizedIntensity >= 40) return 'bg-yellow-500 text-white';
    if (normalizedIntensity >= 20) return 'bg-blue-500 text-white';
    return 'bg-gray-300 text-gray-700';
  };
  
  // Determine intensity text
  const getIntensityText = () => {
    if (normalizedIntensity >= 80) return 'High Intensity';
    if (normalizedIntensity >= 60) return 'Exciting';
    if (normalizedIntensity >= 40) return 'Active';
    if (normalizedIntensity >= 20) return 'Moderate';
    return 'Calm';
  };
  
  // If match is not live, show a static indicator
  if (!isLive) {
    return (
      <Badge variant="outline" className="text-xs text-gray-500 font-normal flex items-center gap-1">
        <Gauge className="h-3 w-3" />
        <span>Upcoming</span>
      </Badge>
    );
  }
  
  return (
    <Badge 
      className={`text-xs font-normal ${getIntensityColor()}`}
    >
      <motion.div
        className="flex items-center gap-1"
        animate={{ 
          scale: normalizedIntensity >= 60 ? [0.95, 1.05, 0.95] : [1, 1, 1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: normalizedIntensity >= 80 ? 0.7 : 1.2,
          ease: "easeInOut"
        }}
      >
        <Activity className="h-3 w-3" />
        <span>{getIntensityText()}</span>
      </motion.div>
    </Badge>
  );
};

export default MatchIntensityIndicator;