import React, { useState } from 'react';

interface MyNewLeagueLogoProps {
  leagueId: number | string;
  leagueName?: string;
  logoUrl?: string; // Still accept this for backwards compatibility, but won't use it
  size?: string;
  className?: string;
  fallbackUrl?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const MyNewLeagueLogo: React.FC<MyNewLeagueLogoProps> = ({
  leagueId,
  leagueName,
  size = '24px',
  className = '',
  fallbackUrl = '/assets/fallback-logo.svg',
  style,
  onClick
}) => {
  const [hasError, setHasError] = useState(false);

  // Use server proxy as primary source - it handles all fallback logic server-side
  const primaryUrl = `/api/league-logo/${leagueId}`;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      console.warn(`🚫 [MyNewLeagueLogo] Server proxy failed for league ${leagueId}, using fallback`);
    }
  };

  const logoStyle: React.CSSProperties = {
    width: size,
    height: size,
    objectFit: 'contain',
    ...style
  };

  return (
    <img
      src={hasError ? fallbackUrl : primaryUrl}
      alt={leagueName || `League ${leagueId}`}
      className={className}
      style={logoStyle}
      onError={handleError}
      onClick={onClick}
      loading="lazy"
    />
  );
};

export default MyNewLeagueLogo;