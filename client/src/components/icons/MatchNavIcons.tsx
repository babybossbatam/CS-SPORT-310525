import React from 'react';

interface NavIconProps {
  className?: string;
}

export const MatchPageIcon: React.FC<NavIconProps> = ({ className = "h-6 w-6" }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" 
      fill="currentColor"
    />
  </svg>
);

export const LineupsIcon: React.FC<NavIconProps> = ({ className = "h-6 w-6" }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM19 19H13V17H19V19ZM19 15H13V13H19V15ZM19 11H13V9H19V11ZM19 7H13V5H19V7Z" 
      fill="currentColor"
    />
  </svg>
);

export const StatsIcon: React.FC<NavIconProps> = ({ className = "h-6 w-6" }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" 
      fill="currentColor"
    />
  </svg>
);

export const StandingsIcon: React.FC<NavIconProps> = ({ className = "h-6 w-6" }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" 
      fill="currentColor"
    />
    <path 
      d="M7 7H9V17H7V7Z" 
      fill="currentColor"
    />
    <path 
      d="M11 7H13V17H11V7Z" 
      fill="currentColor"
    />
    <path 
      d="M15 7H17V17H15V7Z" 
      fill="currentColor"
    />
  </svg>
);

// Simple demo component
export const MatchNavBar: React.FC = () => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white fixed bottom-0 left-0 right-0 border-t border-gray-100">
      <div className="flex flex-col items-center">
        <MatchPageIcon className="h-6 w-6 text-blue-500" />
        <span className="text-[10px] mt-0.5 text-blue-500">Match Page</span>
      </div>
      <div className="flex flex-col items-center">
        <LineupsIcon className="h-6 w-6 text-gray-400" />
        <span className="text-[10px] mt-0.5 text-gray-400">Lineups</span>
      </div>
      <div className="flex flex-col items-center">
        <StatsIcon className="h-6 w-6 text-gray-400" />
        <span className="text-[10px] mt-0.5 text-gray-400">Stats</span>
      </div>
      <div className="flex flex-col items-center">
        <StandingsIcon className="h-6 w-6 text-gray-400" />
        <span className="text-[10px] mt-0.5 text-gray-400">Standings</span>
      </div>
    </div>
  );
};