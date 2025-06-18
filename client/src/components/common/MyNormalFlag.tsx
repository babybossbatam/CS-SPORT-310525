
import React from "react";

interface MyNormalFlagProps {
  teamName: string;
  fallbackUrl?: string;
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
}

const MyNormalFlag: React.FC<MyNormalFlagProps> = ({
  teamName,
  fallbackUrl,
  alt,
  size = "34px",
  className = "",
  moveLeft = false,
}) => {
  return (
    <div
      className={`team-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        left: moveLeft ? "-16px" : "4px",
      }}
    >
      <img
        src={fallbackUrl || "/assets/fallback-logo.svg"}
        alt={alt || teamName}
        className="team-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "0%",
          backgroundColor: "transparent",
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            target.src = "/assets/fallback-logo.svg";
          }
        }}
      />
    </div>
  );
};

export default MyNormalFlag;
