
import React from 'react';
import MyWorldTeamLogo from './MyWorldTeamLogo';

interface BrandedLoadingProps {
  text?: string;
  size?: string;
  className?: string;
}

const BrandedLoading: React.FC<BrandedLoadingProps> = ({ 
  text = "Loading CSSPORT...", 
  size = "64px",
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="animate-pulse">
        <MyWorldTeamLogo
          teamName="CS Sport"
          teamLogo="/cs-sport-logo.png"
          size={size}
          className="rounded-lg shadow-lg"
          alt="CS Sport Logo"
        />
      </div>
      <div className="text-center">
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
};

export default BrandedLoading;
