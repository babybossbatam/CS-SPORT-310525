import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedTeamLogo from './AnimatedTeamLogo';

// Interface for logo history item
interface LogoHistoryItem {
  year: number;
  logoUrl: string;
  description?: string;
}

// Sample historical logo data for demonstration
// In a real scenario, this would come from an API
const sampleLogoHistory: Record<string, LogoHistoryItem[]> = {
  // Manchester United
  "33": [
    { 
      year: 1970, 
      logoUrl: "https://media-4.api-sports.io/football/teams/33.png", 
      description: "Classic Manchester United badge" 
    },
    { 
      year: 1990, 
      logoUrl: "https://media-4.api-sports.io/football/teams/33.png", 
      description: "Redesigned with gold accents" 
    },
    { 
      year: 2000, 
      logoUrl: "https://media-4.api-sports.io/football/teams/33.png", 
      description: "Modern Manchester United crest" 
    }
  ],
  // Barcelona
  "529": [
    { 
      year: 1960, 
      logoUrl: "https://media-4.api-sports.io/football/teams/529.png", 
      description: "Original Barcelona crest" 
    },
    { 
      year: 1980, 
      logoUrl: "https://media-4.api-sports.io/football/teams/529.png", 
      description: "Simplified Barcelona emblem" 
    },
    { 
      year: 2000, 
      logoUrl: "https://media-4.api-sports.io/football/teams/529.png", 
      description: "Modern Barcelona shield" 
    }
  ],
  // Real Madrid
  "541": [
    { 
      year: 1950, 
      logoUrl: "https://media-4.api-sports.io/football/teams/541.png", 
      description: "Early Real Madrid crest" 
    },
    { 
      year: 1980, 
      logoUrl: "https://media-4.api-sports.io/football/teams/541.png", 
      description: "Classic white and gold emblem" 
    },
    { 
      year: 2010, 
      logoUrl: "https://media-4.api-sports.io/football/teams/541.png", 
      description: "Current Real Madrid badge" 
    }
  ],
};

interface TeamLogoEvolutionProps {
  teamId: string;
  teamName: string;
  currentLogo: string;
  onClose?: () => void;
}

const TeamLogoEvolution: React.FC<TeamLogoEvolutionProps> = ({ 
  teamId, 
  teamName, 
  currentLogo,
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  // Get logo history for this team, or use a default with just the current logo
  const logoHistory = sampleLogoHistory[teamId] || [
    { year: new Date().getFullYear(), logoUrl: currentLogo, description: "Current logo" }
  ];
  
  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      if (direction === 'forward') {
        setCurrentIndex(prev => 
          prev === logoHistory.length - 1 ? 0 : prev + 1
        );
      } else {
        setCurrentIndex(prev => 
          prev === 0 ? logoHistory.length - 1 : prev - 1
        );
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, direction, logoHistory.length]);
  
  // Go to specific logo
  const goToLogo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };
  
  // Toggle auto-play
  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };
  
  // Reverse animation direction
  const toggleDirection = () => {
    setDirection(prev => prev === 'forward' ? 'backward' : 'forward');
  };

  return (
    <motion.div 
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{teamName} Logo Evolution</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mb-6 relative flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8, rotateY: direction === 'forward' ? -90 : 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: direction === 'forward' ? 90 : -90 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <AnimatedTeamLogo
              logoUrl={logoHistory[currentIndex].logoUrl}
              teamName={teamName}
              size="lg"
              isHome={true}
            />
            <div className="mt-4 text-center">
              <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {logoHistory[currentIndex].year}
              </span>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {logoHistory[currentIndex].description || "Team logo"}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation dots */}
      <div className="flex justify-center space-x-2 mb-4">
        {logoHistory.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToLogo(idx)}
            className={`h-3 w-3 rounded-full ${idx === currentIndex ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            aria-label={`View logo from ${logoHistory[idx].year}`}
          />
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            setCurrentIndex(prev => (prev === 0 ? logoHistory.length - 1 : prev - 1));
            setIsAutoPlaying(false);
          }}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-full"
          aria-label="Previous logo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={toggleAutoPlay}
          className={`${isAutoPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white p-2 rounded-full`}
          aria-label={isAutoPlaying ? "Pause" : "Play"}
        >
          {isAutoPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <button
          onClick={toggleDirection}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-full"
          aria-label="Change direction"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            setCurrentIndex(prev => (prev === logoHistory.length - 1 ? 0 : prev + 1));
            setIsAutoPlaying(false);
          }}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-full"
          aria-label="Next logo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default TeamLogoEvolution;