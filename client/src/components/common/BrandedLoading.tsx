
import React from 'react';
import MyWorldTeamLogo from './MyWorldTeamLogo';

interface BrandedLoadingProps {
  text?: string;
  size?: string;
  className?: string;
}

const BrandedLoading: React.FC<BrandedLoadingProps> = ({ 
   
  size = "50px",
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="animate-pulse">
       <img src="/CSSPORT_1_updated.png" alt="CS Sport Logo" className="w-[35px] h-[35px]" />
      </div>
      <div className="text-center">
       
      </div>
    </div>
  );
};

export default BrandedLoading;
