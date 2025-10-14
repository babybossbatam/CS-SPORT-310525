import React from "react";
import MyWorldTeamLogo from "./MyWorldTeamLogo";

interface BrandedLoadingProps {
  text?: string;
  size?: string;
  className?: string;
}

const BrandedLoading: React.FC<BrandedLoadingProps> = ({
  size = "50px",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-2 min-h-[200px] w-full ${className}`}
    >
      <div className="animate-pulse">
        <img
          src="/CSSPORT_1_updated.png"
          alt="CS Sport Logo"
          className="w-[85px] h-[65px]"
          loading="eager"
        />
      </div>
    </div>
  );
};

export default BrandedLoading;
