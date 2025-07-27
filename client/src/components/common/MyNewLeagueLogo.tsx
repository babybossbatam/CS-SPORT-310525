
import React, { useState, useMemo } from 'react';
import { enhancedLogoManager } from '../../lib/enhancedLogoManager';
import LazyImage from './LazyImage';

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
  const [isLoading, setIsLoading] = useState(true);

  // Memoized logo URL resolution using enhancedLogoManager
  const logoUrl = useMemo(async () => {
    if (leagueId && leagueName) {
      console.log(`🎯 [MyNewLeagueLogo] Fetching logo for league: ${leagueName} (ID: ${leagueId})`);

      const logoResponse = await enhancedLogoManager.getLeagueLogo('MyNewLeagueLogo', {
        type: 'league',
        shape: 'normal',
        leagueId: leagueId,
        leagueName: leagueName,
        fallbackUrl: fallbackUrl
      });

      console.log(`✅ [MyNewLeagueLogo] Logo resolved for ${leagueName}:`, {
        url: logoResponse.url,
        cached: logoResponse.cached,
        fallbackUsed: logoResponse.fallbackUsed,
        loadTime: logoResponse.loadTime + 'ms'
      });

      return logoResponse.url;
    }

    // Fallback to default logo if no leagueId
    console.log(`⚠️ [MyNewLeagueLogo] No leagueId provided for ${leagueName}, using fallback`);
    return fallbackUrl;
  }, [leagueId, leagueName, fallbackUrl]);

  // Use React.Suspense pattern for async logo loading
  const [resolvedLogoUrl, setResolvedLogoUrl] = React.useState<string>(fallbackUrl);

  React.useEffect(() => {
    if (logoUrl instanceof Promise) {
      logoUrl.then(setResolvedLogoUrl);
    } else {
      setResolvedLogoUrl(logoUrl);
    }
  }, [logoUrl]);

  // Memoized inline styles
  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    position: "relative" as const,
  }), [size]);

  const imageStyle = useMemo(() => ({ 
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%",
    opacity: isLoading ? 0.7 : 1,
    transition: 'opacity 0.2s ease-in-out',
    ...style
  }), [isLoading, style]);

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
      setResolvedLogoUrl(fallbackUrl);
      console.warn(`🚫 [MyNewLeagueLogo] Logo failed for league ${leagueId}, using fallback: ${fallbackUrl}`);
    }
  };

  // For league logos, use regular LazyImage with cached URL
  return (
    <div
      className={`league-logo-container ${className}`}
      style={containerStyle}
    >
      <LazyImage
        src={resolvedLogoUrl}
        alt={leagueName || `League ${leagueId}`}
        title={leagueName}
        className="league-logo"
        style={imageStyle}
        fallbackSrc={fallbackUrl}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
};

export default MyNewLeagueLogo;
