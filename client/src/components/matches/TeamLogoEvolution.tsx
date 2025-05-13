import React, { useState } from 'react';
import TeamLogo from './TeamLogo';

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
  
  // Get logo history for this team, or use a default with just the current logo
  const logoHistory = sampleLogoHistory[teamId] || [
    { year: new Date().getFullYear(), logoUrl: currentLogo, description: "Current logo" }
  ];
  
  // Go to specific logo
  const goToLogo = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md mx-auto">
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
      
      <div className="mb-6 flex justify-center">
        <div className="flex flex-col items-center">
          <TeamLogo
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
        </div>
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
      
      {/* Simple Controls - No animations */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            setCurrentIndex(prev => (prev === 0 ? logoHistory.length - 1 : prev - 1));
          }}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-full"
          aria-label="Previous logo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            setCurrentIndex(prev => (prev === logoHistory.length - 1 ? 0 : prev + 1));
          }}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-full"
          aria-label="Next logo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TeamLogoEvolution;