import React, { useState, useEffect } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Safety measure - disable animations if errors occur
  useEffect(() => {
    try {
      setIsMounted(true);
      
      // Error handler to disable animations
      const handleError = () => {
        console.log("Disabling animations due to error");
        setAnimationsEnabled(false);
      };
      
      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        setIsMounted(false);
      };
    } catch (error) {
      console.error("Error in animation setup:", error);
      setAnimationsEnabled(false);
    }
  }, []);
  
  // Convert form string to array safely
  const formArray = (recentForm || "").split(',').slice(-5);
  
  // Generate sparkles based on team performance
  const sparkleCount = Math.min(Math.floor(performance / 10), 10); // 0-10 sparkles, capped at 10
  
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
  
  // Fallback non-animated version for when animations are disabled
  if (!animationsEnabled) {
    return (
      <div className="relative">
        {/* Recent Form Indicators */}
        <div className="flex justify-center gap-1 mb-1">
          {formArray.map((result, i) => (
            <div
              key={`form-${i}`}
              className={`h-2 w-2 rounded-full ${getResultColor(result)}`}
            />
          ))}
        </div>
        
        {/* Performance Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getPerformanceColor(performance)}`}
            style={{ width: `${performance}%` }}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {/* Recent Form Indicators */}
      <div className="flex justify-center gap-1 mb-1">
        {formArray.map((result, i) => (
          <motion.div
            key={`form-${i}`}
            className={`h-2 w-2 rounded-full ${getResultColor(result)}`}
            initial={{ scale: 0 }}
            animate={isMounted ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          />
        ))}
      </div>
      
      {/* Performance Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full bg-gradient-to-r ${getPerformanceColor(performance)}`}
          initial={{ width: 0 }}
          animate={isMounted ? { width: `${performance}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      {/* Sparkles - only shown if animations are enabled */}
      {isMounted && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {Array.from({ length: sparkleCount }).map((_, i) => {
            // Safe random values
            const randomLeft = Math.min(Math.max(Math.random() * 100, 0), 100);
            const randomTop = Math.min(Math.max(Math.random() * 100, 0), 100);
            const randomSize = Math.min(Math.max(Math.random() * 0.5 + 0.5, 0.5), 1);
            const randomDelay = Math.min(Math.max(Math.random() * 3, 0), 3);
            
            try {
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
            } catch (error) {
              console.error('Error in animation:', error);
              return null; // Return null if animation fails
            }
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPerformanceChart;