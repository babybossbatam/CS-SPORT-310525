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
  const [currentSrc, setCurrentSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use server proxy as primary source - it handles all fallback logic server-side
  const primaryUrl = `/api/league-logo/${leagueId}`;

  // Initialize the source URL
  React.useEffect(() => {
    setCurrentSrc(primaryUrl);
    setHasError(false);
    setIsLoading(true);
    console.log(`🔍 [MyNewLeagueLogo] Loading league ${leagueId} from: ${primaryUrl}`);
  }, [leagueId, primaryUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    if (!hasError) {
      console.log(`✅ [MyNewLeagueLogo] Successfully loaded league ${leagueId} logo`);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackUrl);
      console.warn(`🚫 [MyNewLeagueLogo] Server proxy failed for league ${leagueId}, using fallback: ${fallbackUrl}`);
    } else {
      console.error(`💥 [MyNewLeagueLogo] Even fallback failed for league ${leagueId}`);
    }
  };

  const logoStyle: React.CSSProperties = {
    width: size,
    height: size,
    objectFit: 'contain',
    opacity: isLoading ? 0.7 : 1,
    transition: 'opacity 0.2s ease-in-out',
    ...style
  };

  return (
    <img
      src={currentSrc}
      alt={leagueName || `League ${leagueId}`}
      className={className}
      style={logoStyle}
      onLoad={handleLoad}
      onError={handleError}
      onClick={onClick}
      loading="lazy"
    />
  );
};

export default MyNewLeagueLogo;