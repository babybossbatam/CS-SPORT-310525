
import React, { useState, useEffect } from "react";

interface MyNormalTeamLogoProps {
  teamName: string;
  teamId?: number | string;
  fallbackUrl?: string;
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
}

const MyNormalTeamLogo: React.FC<MyNormalTeamLogoProps> = ({
  teamName,
  teamId,
  fallbackUrl,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
}) => {
  const getTeamLogoUrl = (teamName: string, teamId?: number | string, fallbackUrl?: string) => {
    // Try to get team logo from various sources
    if (teamId) {
      return `https://media.api-sports.io/football/teams/${teamId}.png`;
    }
    
    // Final fallback
    return fallbackUrl || "/assets/fallback-logo.svg";
  };

  return (
    <div
      className={`team-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        left: moveLeft ? "-16px" : "4px",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.05) 100%)",
        transform: "translateZ(0)",
        transition: "all 0.3s ease"
      }}
    >
      <img
        src={getTeamLogoUrl(teamName, teamId, fallbackUrl)}
        alt={alt || teamName}
        className="team-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) brightness(1.1) contrast(1.2)",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            target.src = fallbackUrl || "/assets/fallback-logo.svg";
          }
        }}
      />
      
      {/* Glossy overlay */}
      <div 
        className="gloss-overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 30%, rgba(255, 255, 255, 0.1) 60%, rgba(0, 0, 0, 0.05) 100%)",
          zIndex: 2,
          pointerEvents: "none",
          mixBlendMode: "overlay"
        }}
      ></div>
      
      {/* Highlight spot for 3D effect */}
      <div 
        className="highlight-spot"
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: "25%",
          height: "25%",
          background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 50%, transparent 80%)",
          borderRadius: "50%",
          zIndex: 3,
          pointerEvents: "none",
          filter: "blur(0.5px)"
        }}
      ></div>
    </div>
  );
};

export default MyNormalTeamLogo;
