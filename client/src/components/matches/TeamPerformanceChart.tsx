import React from 'react';
import { motion } from 'framer-motion';

interface TeamPerformanceChartProps {
  teamId: number;
  recentForm: string; // Format: "W,L,D,W,W" for Win, Loss, Draw
  performance: number; // 0-100 rating of team performance
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({
  teamId,
  recentForm = "W,D,W,L,D",
  performance = 65
}) => {
  // Convert form string to array
  const formArray = recentForm.split(',').slice(-5);
  
  // Generate sparkles based on team performance
  const sparkleCount = Math.floor(performance / 10); // 0-10 sparkles
  
  // Different colors for different result types
  const getResultColor = (result: string) => {
    switch (result) {
      case 'W': return 'bg-green-500';
      case 'L': return 'bg-red-500';
      case 'D': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };
  
  const getPerformanceColor = (perf: number) => {
    if (perf >= 80) return 'from-green-600 to-green-300';
    if (perf >= 60) return 'from-blue-600 to-blue-300';
    if (perf >= 40) return 'from-yellow-600 to-yellow-300';
    if (perf >= 20) return 'from-orange-600 to-orange-300';
    return 'from-red-600 to-red-300';
  };
  
  return (
    <div className="relative">
      {/* Recent Form Indicators */}
      <div className="flex justify-center gap-1 mb-1">
        {formArray.map((result, i) => (
          <motion.div
            key={`form-${i}`}
            className={`h-2 w-2 rounded-full ${getResultColor(result)}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          />
        ))}
      </div>
      
      {/* Performance Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full bg-gradient-to-r ${getPerformanceColor(performance)}`}
          initial={{ width: 0 }}
          animate={{ width: `${performance}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      {/* Sparkles */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {Array.from({ length: sparkleCount }).map((_, i) => {
          const randomLeft = Math.random() * 100;
          const randomTop = Math.random() * 100;
          const randomSize = Math.random() * 0.5 + 0.5; // 0.5-1
          const randomDelay = Math.random() * 3;
          
          return (
            <motion.div 
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full shadow-glow"
              style={{ 
                left: `${randomLeft}%`, 
                top: `${randomTop}%`,
                boxShadow: '0 0 3px 1px rgba(255, 255, 255, 0.8)'
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, randomSize, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                delay: randomDelay,
                repeatDelay: Math.random() * 2 + 1
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TeamPerformanceChart;