
import React from 'react';
import MyWorldTeamLogo from './MyWorldTeamLogo';

interface AnimatedBrandedLoadingProps {
  text?: string;
  size?: string;
  className?: string;
}

const AnimatedBrandedLoading: React.FC<AnimatedBrandedLoadingProps> = ({ 
  text = "Loading CSSPORT...", 
  size = "64px",
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="animate-bounce">
        <MyWorldTeamLogo
          teamName="CS Sport"
          teamLogo="/cs-sport-logo.png"
          size={size}
          className="rounded-lg shadow-lg filter drop-shadow-md"
          alt="CS Sport Logo"
        />
      </div>
      <div className="text-center">
        <p className="text-gray-600 font-medium animate-pulse">{text}</p>
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedBrandedLoading;
