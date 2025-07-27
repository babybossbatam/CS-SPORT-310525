import React from 'react';
import LazyImage from './LazyImage';

interface MyNewLeagueLogoProps {
  leagueId: number | string;
  leagueName?: string;
  size?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const MyNewLeagueLogo: React.FC<MyNewLeagueLogoProps> = ({
  leagueId,
  leagueName = 'Unknown League',
  size = '24px',
  className = '',
  style,
  onClick
}) => {
  // Simple direct server proxy URL - no validation, no fallback complexity
  const logoUrl = `/api/league-logo/${leagueId}`;

  const containerStyle = {
    width: size,
    height: size,
    position: "relative" as const,
  };

  const imageStyle = { 
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%",
    ...style
  };

  return (
    <div
      className={`league-logo-container ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      <LazyImage
        src={logoUrl}
        alt={leagueName || `League ${leagueId}`}
        title={leagueName}
        className="league-logo"
        style={imageStyle}
        loading="lazy"
      />
    </div>
  );
};

export default MyNewLeagueLogo;